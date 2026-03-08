# pipelines/lstm_pipeline.py

import pandas as pd
import numpy as np
from groq import Groq


def run_optimind_pipeline(
    df,
    model,
    scaler_X,
    scaler_y,
    le,
    groq_api_key
):
    print("\n⚡ ENTERED LSTM PIPELINE")

    LOOKBACK = 28
    ORDER_COST = 500
    UNIT_COST = 10
    HOLDING_RATE = 0.2
    SERVICE_LEVEL_Z = 1.65
    LEAD_TIME = 14
    HOLDING_COST = UNIT_COST * HOLDING_RATE

    df = df.copy()

    print("📊 Incoming dataframe shape:", df.shape)

    # ✅ Robust SKU_ID handling (fixes StringDtype numpy error)
    sku_numeric = pd.to_numeric(df.get("SKU_ID"), errors="coerce") if "SKU_ID" in df.columns else None
    if sku_numeric is not None and sku_numeric.notna().mean() > 0.9:
        # Treat SKU_ID as encoded integers and decode back to original SKUs
        df["SKU_ID"] = le.inverse_transform(sku_numeric.fillna(0).astype(int).values)

    # Ensure SKU_ID is clean string
    if "SKU_ID" not in df.columns:
        raise ValueError("Optimind format requires 'SKU_ID' column.")

    df["SKU_ID"] = df["SKU_ID"].astype(str).str.strip()

    # Filter to only SKUs known by the encoder
    valid_skus = set(df["SKU_ID"]).intersection(set(le.classes_))
    df = df[df["SKU_ID"].isin(valid_skus)]
    print("🧾 Valid SKUs:", len(valid_skus))

    if df.empty:
        raise ValueError("No valid SKUs found in uploaded file (none match trained SKU encoder).")

    # Date + Units_Sold cleanup
    if "Date" not in df.columns or "Units_Sold" not in df.columns:
        raise ValueError("Optimind format requires 'Date' and 'Units_Sold' columns.")

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["Units_Sold"] = pd.to_numeric(df["Units_Sold"], errors="coerce")

    # Drop rows with invalid dates, fill missing sales with 0
    df = df.dropna(subset=["Date"])
    df["Units_Sold"] = df["Units_Sold"].replace([np.inf, -np.inf], np.nan).fillna(0)

    # Sort + encode
    df = df.sort_values(["SKU_ID", "Date"])
    df["Encoded_SKU"] = le.transform(df["SKU_ID"])

    # Log transform (safe)
    df["Units_Sold_Log"] = np.log1p(df["Units_Sold"])

    forecast_rows = []

    print("📦 Starting SKU forecasting loop...")

    for sku, sku_df in df.groupby("Encoded_SKU"):
        if len(sku_df) < LOOKBACK:
            continue

        original_name = le.inverse_transform([sku])[0]
        print("   Forecasting:", original_name)

        last_28 = sku_df["Units_Sold_Log"].values[-LOOKBACK:].astype(np.float32)

        # Scale input window safely
        window_scaled = scaler_X.transform(last_28.reshape(-1, 1)).astype(np.float32)
        temp_window = window_scaled.reshape(1, LOOKBACK, 1)

        preds_30 = []

        for _ in range(30):
            pred_scaled = model.predict(temp_window, verbose=0)

            # Convert prediction back to log space, then to actual units
            pred_log = scaler_y.inverse_transform(pred_scaled)[0][0]
            pred = float(np.expm1(pred_log))
            preds_30.append(pred)

            # Roll the window and append new prediction (in log space)
            temp_window = np.roll(temp_window, -1, axis=1)
            new_scaled = scaler_X.transform([[np.log1p(pred)]])[0][0]
            temp_window[0, -1, 0] = new_scaled

        monthly_demand = float(np.sum(preds_30))
        avg_daily = monthly_demand / 30.0
        std = avg_daily * 0.3

        eoq = np.sqrt((2 * monthly_demand * ORDER_COST) / HOLDING_COST) if monthly_demand > 0 else 0
        rop = (avg_daily * LEAD_TIME) + SERVICE_LEVEL_Z * std * np.sqrt(LEAD_TIME)

        forecast_rows.append({
            "SKU_ID": original_name,
            "Forecasted_Demand": round(monthly_demand, 2),
            "EOQ": int(eoq),
            "ROP": int(rop)
        })

    forecast_df = pd.DataFrame(forecast_rows)

    print("✅ Forecast calculation complete")
    print("🧾 Total SKUs forecasted:", len(forecast_df))

    # LLM
    print("🤖 Starting LLM generation...")

    # ✅ Use env / passed API key (do NOT hardcode keys)
    if not groq_api_key:
        # Still return forecast without LLM if key missing
        forecast_df["Manager_Explanation"] = ["GROQ_API_KEY not set."] * len(forecast_df)
        print("⚠️ GROQ_API_KEY missing — skipping LLM.")
        print("🏁 LSTM PIPELINE COMPLETE\n")
        return forecast_df

    client = Groq(api_key=groq_api_key)
    reports = []

    for i, row in forecast_df.iterrows():
        print(f"   Generating LLM report {i+1}/{len(forecast_df)}")

        prompt = f"""
You are a senior retail demand analyst.

SKU: {row['SKU_ID']}
Predicted Monthly Demand: {row['Forecasted_Demand']}
EOQ: {row['EOQ']}
ROP: {row['ROP']}

Provide:
1. Demand Summary
2. Inventory Insight
3. Risk Factors
4. Recommended Action

Keep under 200 words.
End with: End of report.
"""

        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=400
            )
            reports.append(response.choices[0].message.content.strip())
        except Exception as e:
            reports.append(f"LLM error: {str(e)}")

    forecast_df["Manager_Explanation"] = reports

    print("🏁 LSTM PIPELINE COMPLETE\n")

    return forecast_df
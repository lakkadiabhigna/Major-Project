# # pipelines/lstm_pipeline.py

# import pandas as pd
# import numpy as np
# from groq import Groq


# def run_optimind_pipeline(
#     df,
#     model,
#     scaler_X,
#     scaler_y,
#     le,
#     groq_api_key
# ):
#     print("\n⚡ ENTERED LSTM PIPELINE")

#     LOOKBACK = 28
#     ORDER_COST = 500
#     UNIT_COST = 10
#     HOLDING_RATE = 0.2
#     SERVICE_LEVEL_Z = 1.65
#     LEAD_TIME = 14
#     HOLDING_COST = UNIT_COST * HOLDING_RATE

#     df = df.copy()

#     print("📊 Incoming dataframe shape:", df.shape)

#     # ✅ Robust SKU_ID handling (fixes StringDtype numpy error)
#     sku_numeric = pd.to_numeric(df.get("SKU_ID"), errors="coerce") if "SKU_ID" in df.columns else None
#     if sku_numeric is not None and sku_numeric.notna().mean() > 0.9:
#         # Treat SKU_ID as encoded integers and decode back to original SKUs
#         df["SKU_ID"] = le.inverse_transform(sku_numeric.fillna(0).astype(int).values)

#     # Ensure SKU_ID is clean string
#     if "SKU_ID" not in df.columns:
#         raise ValueError("Optimind format requires 'SKU_ID' column.")

#     df["SKU_ID"] = df["SKU_ID"].astype(str).str.strip()

#     # Filter to only SKUs known by the encoder
#     valid_skus = set(df["SKU_ID"]).intersection(set(le.classes_))
#     df = df[df["SKU_ID"].isin(valid_skus)]
#     print("🧾 Valid SKUs:", len(valid_skus))

#     if df.empty:
#         raise ValueError("No valid SKUs found in uploaded file (none match trained SKU encoder).")

#     # Date + Units_Sold cleanup
#     if "Date" not in df.columns or "Units_Sold" not in df.columns:
#         raise ValueError("Optimind format requires 'Date' and 'Units_Sold' columns.")

#     df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
#     df["Units_Sold"] = pd.to_numeric(df["Units_Sold"], errors="coerce")

#     # Drop rows with invalid dates, fill missing sales with 0
#     df = df.dropna(subset=["Date"])
#     df["Units_Sold"] = df["Units_Sold"].replace([np.inf, -np.inf], np.nan).fillna(0)

#     # Sort + encode
#     df = df.sort_values(["SKU_ID", "Date"])
#     df["Encoded_SKU"] = le.transform(df["SKU_ID"])

#     # Log transform (safe)
#     df["Units_Sold_Log"] = np.log1p(df["Units_Sold"])

#     forecast_rows = []

#     print("📦 Starting SKU forecasting loop...")

#     for sku, sku_df in df.groupby("Encoded_SKU"):
#         if len(sku_df) < LOOKBACK:
#             continue

#         original_name = le.inverse_transform([sku])[0]
#         print("   Forecasting:", original_name)

#         last_28 = sku_df["Units_Sold_Log"].values[-LOOKBACK:].astype(np.float32)

#         # Scale input window safely
#         window_scaled = scaler_X.transform(last_28.reshape(-1, 1)).astype(np.float32)
#         temp_window = window_scaled.reshape(1, LOOKBACK, 1)

#         preds_30 = []

#         for _ in range(30):
#             pred_scaled = model.predict(temp_window, verbose=0)

#             # Convert prediction back to log space, then to actual units
#             pred_log = scaler_y.inverse_transform(pred_scaled)[0][0]
#             pred = float(np.expm1(pred_log))
#             preds_30.append(pred)

#             # Roll the window and append new prediction (in log space)
#             temp_window = np.roll(temp_window, -1, axis=1)
#             new_scaled = scaler_X.transform([[np.log1p(pred)]])[0][0]
#             temp_window[0, -1, 0] = new_scaled

#         monthly_demand = float(np.sum(preds_30))
#         avg_daily = monthly_demand / 30.0
#         std = avg_daily * 0.3

#         eoq = np.sqrt((2 * monthly_demand * ORDER_COST) / HOLDING_COST) if monthly_demand > 0 else 0
#         rop = (avg_daily * LEAD_TIME) + SERVICE_LEVEL_Z * std * np.sqrt(LEAD_TIME)

#         forecast_rows.append({
#             "SKU_ID": original_name,
#             "Forecasted_Demand": round(monthly_demand, 2),
#             "EOQ": int(eoq),
#             "ROP": int(rop)
#         })

#     forecast_df = pd.DataFrame(forecast_rows)

#     print("✅ Forecast calculation complete")
#     print("🧾 Total SKUs forecasted:", len(forecast_df))

#     # LLM
#     print("🤖 Starting LLM generation...")

#     # ✅ Use env / passed API key (do NOT hardcode keys)
#     if not groq_api_key:
#         # Still return forecast without LLM if key missing
#         forecast_df["Manager_Explanation"] = ["GROQ_API_KEY not set."] * len(forecast_df)
#         print("⚠️ GROQ_API_KEY missing — skipping LLM.")
#         print("🏁 LSTM PIPELINE COMPLETE\n")
#         return forecast_df

#     client = Groq(api_key=groq_api_key)
#     reports = []

#     for i, row in forecast_df.iterrows():
#         print(f"   Generating LLM report {i+1}/{len(forecast_df)}")

#         prompt = f"""
# You are a senior retail demand analyst.

# SKU: {row['SKU_ID']}
# Predicted Monthly Demand: {row['Forecasted_Demand']}
# EOQ: {row['EOQ']}
# ROP: {row['ROP']}

# Provide:
# 1. Demand Summary
# 2. Inventory Insight
# 3. Risk Factors
# 4. Recommended Action

# Keep under 200 words.
# End with: End of report.
# """

#         try:
#             response = client.chat.completions.create(
#                 model="llama-3.1-8b-instant",
#                 messages=[{"role": "user", "content": prompt}],
#                 temperature=0.4,
#                 max_tokens=400
#             )
#             reports.append(response.choices[0].message.content.strip())
#         except Exception as e:
#             reports.append(f"LLM error: {str(e)}")

#     forecast_df["Manager_Explanation"] = reports

#     print("🏁 LSTM PIPELINE COMPLETE\n")

#     return forecast_df

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
    SPIKE_THRESHOLD = 0.7

    df = df.copy()

    print("📊 Incoming dataframe shape:", df.shape)

    # -----------------------------
    # LOAD FESTIVAL DATASET
    # -----------------------------
    festival_df = pd.read_excel("models/Indian_Festivals_2022.xlsx")

    festival_df["Date"] = pd.to_datetime(festival_df["Date"])
    festival_df = festival_df[["Date", "Festival name"]]

    festival_df.rename(columns={
        "Festival name": "Festival"
    }, inplace=True)

    print("✅ Festival dataset loaded")

    # -----------------------------
    # BASIC VALIDATION
    # -----------------------------
    required_cols = ["SKU_ID", "Date", "Units_Sold"]

    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"❌ Missing required column: {col}")

    print("✅ Required columns verified")

    # -----------------------------
    # FIX SKU FORMAT IF NUMERIC
    # -----------------------------
    if np.issubdtype(df["SKU_ID"].dtype, np.number):
        df["SKU_ID"] = le.inverse_transform(df["SKU_ID"].astype(int))

    df["SKU_ID"] = df["SKU_ID"].astype(str).str.strip()

    valid_skus = set(df["SKU_ID"]).intersection(set(le.classes_))

    if len(valid_skus) == 0:
        raise ValueError("❌ No matching SKUs found with trained model.")

    df = df[df["SKU_ID"].isin(valid_skus)]

    print(f"✅ Valid SKUs found: {len(valid_skus)}")

    # -----------------------------
    # SORT & PREPROCESS
    # -----------------------------
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values(["SKU_ID", "Date"])

    df["Encoded_SKU"] = le.transform(df["SKU_ID"])

    df["Units_Sold_Log"] = np.log1p(df["Units_Sold"])

    # -----------------------------
    # FESTIVAL DETECTION FUNCTION
    # -----------------------------
    def get_nearby_festival(date, festival_df, window=5):

        festivals = []

        for _, row in festival_df.iterrows():

            fest_date = row["Date"]
            fest_this_year = fest_date.replace(year=date.year)

            diff = abs((fest_this_year - date).days)

            if diff <= window:
                festivals.append(row["Festival"])

        if festivals:
            return ", ".join(set(festivals))

        return "None"

    # -----------------------------
    # FORECASTING + SPIKE DETECTION
    # -----------------------------
    forecast_rows = []

    for sku, sku_df in df.groupby("Encoded_SKU"):

        if len(sku_df) < LOOKBACK:
            continue

        original_name = le.inverse_transform([sku])[0]

        latest_date = sku_df["Date"].max()

        festival_near = get_nearby_festival(latest_date, festival_df)

        last_28 = sku_df["Units_Sold_Log"].values[-LOOKBACK:]

        window = scaler_X.transform(last_28.reshape(-1, 1)).reshape(1, LOOKBACK, 1)

        preds_30 = []

        temp_window = window.copy()

        for i in range(30):

            pred_scaled = model.predict(temp_window, verbose=0)

            pred_log = scaler_y.inverse_transform(pred_scaled)[0][0]

            pred = np.expm1(pred_log)

            preds_30.append(pred)

            temp_window = np.roll(temp_window, -1, axis=1)

            new_scaled = scaler_X.transform([[np.log1p(pred)]])

            temp_window[0, -1, 0] = new_scaled

        monthly_demand = sum(preds_30)

        avg_daily = monthly_demand / 30

        # =====================================================
        # DATA-DRIVEN INVENTORY PARAMETERS
        # =====================================================

        recent_sales = np.expm1(last_28)

        real_std = np.std(recent_sales)

        cv = real_std / avg_daily if avg_daily > 0 else 0

        dynamic_lead_time = int(7 + (cv * 10))

        dynamic_lead_time = max(5, min(21, dynamic_lead_time))

        dynamic_holding_cost = HOLDING_COST * (1 + (cv * 3))

        dynamic_order_cost = ORDER_COST * (1 + cv)

        dynamic_eoq = np.sqrt((2 * monthly_demand * dynamic_order_cost) / dynamic_holding_cost)

        dynamic_rop = (avg_daily * dynamic_lead_time) + SERVICE_LEVEL_Z * real_std * np.sqrt(dynamic_lead_time)

        # =====================================================

        # SPIKE DETECTION
        recent_avg = np.mean(np.expm1(last_28))

        spike_flags = [p > recent_avg * SPIKE_THRESHOLD for p in preds_30]

        spike_days = [i + 1 for i, flag in enumerate(spike_flags) if flag]

        spike_info = {
            "Spike_Detected": bool(any(spike_flags)),
            "Spike_Days": spike_days,
            "Max_Spike_Multiplier": max(preds_30) / recent_avg if any(spike_flags) else None
        }

        forecast_rows.append({
            "SKU_ID": original_name,
            "Nearby_Festival": festival_near,
            "Forecasted_Demand": round(monthly_demand, 2),
            "EOQ": int(dynamic_eoq),
            "ROP": int(dynamic_rop),
            "Lead_Time": dynamic_lead_time,
            "Spike_Detected": spike_info["Spike_Detected"],
            "Spike_Days": spike_info["Spike_Days"],
            "Max_Spike_Multiplier": spike_info["Max_Spike_Multiplier"]
        })

    forecast_df = pd.DataFrame(forecast_rows)

    forecast_df["Festival_Spike_Link"] = forecast_df.apply(
        lambda row: f"The spike may be influenced by the nearby festival: {row['Nearby_Festival']}."
        if row["Spike_Detected"] and row["Nearby_Festival"] != "None"
        else "No festival-driven spike detected.",
        axis=1
    )

    print("✅ Forecasting completed")
    print("Total SKUs forecasted:", len(forecast_df))

    # -----------------------------
    # ADD BASIC EXPLANATIONS
    # -----------------------------
    forecast_df["Demand_Explanation"] = forecast_df.apply(
        lambda row: f"Demand for {row['SKU_ID']} is driven by recent 28-day sales momentum captured by the LSTM forecasting model.",
        axis=1
    )

    forecast_df["Inventory_Explanation"] = forecast_df.apply(
        lambda row: f"Based on demand variability, order {row['EOQ']} units and reorder when inventory reaches {row['ROP']} units with an estimated lead time of {row['Lead_Time']} days.",
        axis=1
    )

    # -----------------------------
    # LLM CLIENT
    # -----------------------------
    client = Groq(api_key=groq_api_key)

    # -----------------------------
    # SPIKE EXPLANATION
    # -----------------------------
    spike_explanations = []

    for _, row in forecast_df.iterrows():

        try:

            spike_prompt = f"""
You are a retail demand analytics assistant.

SKU: {row['SKU_ID']}
Spike Detected: {row['Spike_Detected']}
Spike Days: {row['Spike_Days']}
Spike Multiplier: {row['Max_Spike_Multiplier']}
Nearby Festival: {row['Nearby_Festival']}

If a spike occurs and a festival is nearby, explain that the spike may be influenced by festival demand.
If there is no spike, say demand is stable.

Explain in 2-3 sentences.
"""

            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": spike_prompt}],
                temperature=0.5,
                max_tokens=120
            )

            spike_text = response.choices[0].message.content.strip()

        except Exception as e:
            spike_text = f"Spike explanation generation failed: {str(e)}"

        spike_explanations.append(spike_text)

    forecast_df["Spike_Explanation"] = spike_explanations

    # -----------------------------
    # MANAGER EXPLANATION
    # -----------------------------
    manager_explanations = []

    for _, row in forecast_df.iterrows():

        try:

            prompt = f"""
You are a senior retail demand analyst.

SKU: {row['SKU_ID']}
Predicted Monthly Demand: {row['Forecasted_Demand']}
EOQ: {row['EOQ']}
ROP: {row['ROP']}
Nearby Festival: {row['Nearby_Festival']}
Spike Info: {row['Spike_Explanation']}

Explain demand and inventory insights in 5 sections.
"""

            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=500
            )

            explanation = response.choices[0].message.content.strip()

        except Exception as e:
            explanation = f"LLM generation failed: {str(e)}"

        manager_explanations.append(explanation)

    forecast_df["Manager_Explanation"] = manager_explanations

    print("🏁 LSTM PIPELINE COMPLETE\n")

    return forecast_df
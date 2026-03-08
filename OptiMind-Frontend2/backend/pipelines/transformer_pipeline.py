# pipelines/transformer_pipeline.py

import pandas as pd
import numpy as np
from groq import Groq


def run_m5_transformer_full_pipeline(
    df,
    model,
    scaler,
    config,
    groq_api_key
):
    SEQ_LEN = config["SEQ_LEN"]

    df = df.copy()

    # ==========================================================
    # 1️⃣ Validate Required Columns
    # ==========================================================

    required_meta_cols = ["id", "item_id", "dept_id", "cat_id", "store_id", "state_id"]

    for col in required_meta_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # ==========================================================
    # 2️⃣ Safe d_ Column Detection
    # ==========================================================

    day_cols = []

    for col in df.columns:
        if col.startswith("d_"):
            parts = col.split("_")
            if len(parts) == 2 and parts[1].isdigit():
                day_cols.append(col)

    if len(day_cols) == 0:
        raise ValueError("No valid daily columns found (expected d_1, d_2, ...)")

    day_cols = sorted(day_cols, key=lambda x: int(x.split("_")[1]))

    if len(day_cols) < SEQ_LEN:
        raise ValueError(
            f"At least {SEQ_LEN} daily columns required, but only {len(day_cols)} found"
        )

    # ==========================================================
    # 3️⃣ Convert Daily Columns to Numeric
    # ==========================================================

    df[day_cols] = df[day_cols].apply(pd.to_numeric, errors="coerce")

    if df[day_cols].isnull().sum().sum() > 0:
        raise ValueError("Daily columns contain non-numeric values.")

    # ==========================================================
    # 4️⃣ Melt to Long Format
    # ==========================================================

    sales_long = df.melt(
        id_vars=required_meta_cols,
        value_vars=day_cols,
        var_name="day",
        value_name="sales"
    )

    sales_long["day"] = sales_long["day"].str.replace("d_", "").astype(int)
    sales_long = sales_long.sort_values(["id", "day"])

    # ==========================================================
    # 5️⃣ FEATURE ENGINEERING (MATCH TRAINING EXACTLY)
    # ==========================================================

    sales_long["day_sin"]  = np.sin(2 * np.pi * sales_long["day"] / 365)
    sales_long["day_cos"]  = np.cos(2 * np.pi * sales_long["day"] / 365)
    sales_long["week_sin"] = np.sin(2 * np.pi * sales_long["day"] / 7)
    sales_long["week_cos"] = np.cos(2 * np.pi * sales_long["day"] / 7)

    sales_long["sales_log"] = np.log1p(sales_long["sales"])
    sales_long["sales_scaled"] = scaler.transform(
        sales_long[["sales_log"]]
    )

    # ==========================================================
    # 6️⃣ Build Sequences (5 FEATURES — FIXED)
    # ==========================================================

    X, y, sku_ids = [], [], []

    feature_cols = [
        "sales_scaled",
        "day_sin",
        "day_cos",
        "week_sin",
        "week_cos"
    ]

    for sku, g in sales_long.groupby("id"):
        g = g.sort_values("day")

        feats = g[feature_cols].values
        target = g["sales_scaled"].values

        if len(feats) < SEQ_LEN:
            continue

        X.append(feats[-SEQ_LEN:])
        y.append(target[-1])
        sku_ids.append(sku)

    if len(X) == 0:
        raise ValueError("No sequences could be built.")

    X_test = np.array(X)
    y_test = np.array(y)

    print("Sequences ready:", X_test.shape)

    # ==========================================================
    # 7️⃣ Prediction
    # ==========================================================

    pred_scaled = model.predict(X_test, verbose=0).flatten()

    # ==========================================================
    # 8️⃣ Inverse Scaling
    # ==========================================================

    y_log = scaler.inverse_transform(y_test.reshape(-1, 1)).flatten()
    p_log = scaler.inverse_transform(pred_scaled.reshape(-1, 1)).flatten()

    y_real = np.expm1(y_log)
    p_real = np.expm1(p_log)

    # ==========================================================
    # 9️⃣ LLM Manager Report
    # ==========================================================

    print("🔐 GROQ KEY RECEIVED IN TRANSFORMER:", groq_api_key)
    client = Groq(api_key=groq_api_key)

    reports = []

    for i in range(len(sku_ids)):

        prompt = f"""
You are a senior retail demand forecasting analyst.

SKU: {sku_ids[i]}
Predicted Next-Day Demand: {p_real[i]:.2f}

Provide:
1. Demand Outlook
2. Business Impact
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

    # ==========================================================
    # 🔟 Final Output
    # ==========================================================

    results = pd.DataFrame({
        "SKU_ID": sku_ids,
        "Predicted_Demand": p_real,
        "Manager_Explanation": reports
    })

    return results
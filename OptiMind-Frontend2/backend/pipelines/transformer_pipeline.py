import pandas as pd
import numpy as np
from groq import Groq
from datetime import datetime, timedelta

def run_m5_transformer_full_pipeline(
    df,
    model,
    scaler,
    config,
    groq_api_key,
    base_date
):
    # ==========================================================
    # BASE DATE FROM USER
    # ==========================================================

    if isinstance(base_date, str):
        base_date = datetime.strptime(base_date, "%Y-%m-%d")

    SEQ_LEN = config["SEQ_LEN"]

    ORDER_COST = 500
    UNIT_COST = 10
    HOLDING_RATE = 0.2
    SERVICE_LEVEL_Z = 1.65
    HOLDING_COST = UNIT_COST * HOLDING_RATE
    SPIKE_THRESHOLD = 0.5

    df = df.copy()

    # ==========================================================
    # LOAD FESTIVAL DATASET
    # ==========================================================

    festival_df = pd.read_excel("models/Indian_Festivals_2022.xlsx")

    festival_df["Date"] = pd.to_datetime(festival_df["Date"])
    festival_df = festival_df[["Date", "Festival name"]]

    festival_df.rename(columns={"Festival name": "Festival"}, inplace=True)


        # ==========================================================
    # FESTIVAL DETECTION NEAR SPIKE DAYS
    # ==========================================================

    def detect_festival_near_spikes(spike_days, base_date, festival_df):

        nearby_festivals = []

        for spike_day in spike_days:

            spike_date = base_date + timedelta(days=spike_day)

            for _, row in festival_df.iterrows():

                fest_date = row["Date"]

                # Adjust year to match base date
                fest_date = fest_date.replace(year=base_date.year)

                # Check ±7 days window
                if abs((fest_date - spike_date).days) <= 7:
                    nearby_festivals.append(row["Festival"])

        if nearby_festivals:
            return ", ".join(list(set(nearby_festivals)))

        return "None"

    # ==========================================================
    # VALIDATE REQUIRED COLUMNS
    # ==========================================================

    required_meta_cols = ["id","item_id","dept_id","cat_id","store_id","state_id"]

    for col in required_meta_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # ==========================================================
    # FIND DAILY COLUMNS
    # ==========================================================

    day_cols = []

    for col in df.columns:
        if col.startswith("d_"):
            parts = col.split("_")
            if len(parts) == 2 and parts[1].isdigit():
                day_cols.append(col)

    if len(day_cols) == 0:
        raise ValueError("No valid daily columns found")

    day_cols = sorted(day_cols, key=lambda x: int(x.split("_")[1]))

    if len(day_cols) < SEQ_LEN:
        raise ValueError("Not enough daily columns")

    df[day_cols] = df[day_cols].apply(pd.to_numeric, errors="coerce")

    # ==========================================================
    # MELT DATA
    # ==========================================================

    sales_long = df.melt(
        id_vars=required_meta_cols,
        value_vars=day_cols,
        var_name="day",
        value_name="sales"
    )

    sales_long["day"] = sales_long["day"].str.replace("d_","").astype(int)
    sales_long = sales_long.sort_values(["id","day"])

    # ==========================================================
    # FEATURE ENGINEERING
    # ==========================================================

    sales_long["day_sin"] = np.sin(2*np.pi*sales_long["day"]/365)
    sales_long["day_cos"] = np.cos(2*np.pi*sales_long["day"]/365)

    sales_long["week_sin"] = np.sin(2*np.pi*sales_long["day"]/7)
    sales_long["week_cos"] = np.cos(2*np.pi*sales_long["day"]/7)

    sales_long["sales_log"] = np.log1p(sales_long["sales"])

    sales_long["sales_scaled"] = scaler.transform(
        sales_long[["sales_log"]]
    )

    # ==========================================================
    # BUILD SEQUENCES
    # ==========================================================

    X = []
    sku_ids = []

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

        if len(feats) < SEQ_LEN:
            continue

        X.append(feats[-SEQ_LEN:])
        sku_ids.append(sku)

    X_test = np.array(X)

    
    # ==========================================================
    # FORECAST LOOP
    # ==========================================================

    rows = []

    for i, sku in enumerate(sku_ids):

        seq = X_test[i].copy()

        preds_30 = []

        for step in range(30):

            pred_scaled = model.predict(
                seq.reshape(1,SEQ_LEN,5),
                verbose=0
            )[0][0]

            pred_log = scaler.inverse_transform([[pred_scaled]])[0][0]

            pred = np.expm1(pred_log)

            preds_30.append(pred)

            seq = np.roll(seq,-1,axis=0)

            new_scaled = scaler.transform(
                pd.DataFrame([[np.log1p(pred)]],columns=["sales_log"])
            )[0][0]

            seq[-1][0] = new_scaled
            # 👇 ADD THIS TEMPORARY DEBUG
        print("SKU:", sku)
        print("Predicted next 30 days:", preds_30)

        monthly_demand = sum(preds_30)

        avg_daily = monthly_demand / 30

        # =====================================================
        # INVENTORY CALCULATIONS
        # =====================================================

        history = sales_long[sales_long["id"] == sku]["sales"].values[-30:]

        real_std = np.std(history)

        cv = real_std / avg_daily if avg_daily > 0 else 0

        lead_time = int(7 + (cv*10))

        lead_time = max(5, min(21, lead_time))

        dynamic_holding_cost = HOLDING_COST * (1 + (cv*3))

        dynamic_order_cost = ORDER_COST * (1 + cv)

        eoq = np.sqrt((2 * monthly_demand * dynamic_order_cost) / dynamic_holding_cost)

        rop = (avg_daily * lead_time) + SERVICE_LEVEL_Z * real_std * np.sqrt(lead_time)

        # SPIKE DETECTION
        # =====================================================

        mean_pred = np.mean(preds_30)
        std_pred = np.std(preds_30)

        SPIKE_STD_FACTOR = 2.0   # sensitivity

        spike_days = []

        for idx, p in enumerate(preds_30):

            if std_pred > 0 and abs(p - mean_pred) > SPIKE_STD_FACTOR * std_pred:
                spike_days.append(idx + 1)

        spike_detected = len(spike_days) > 0

        max_spike = None
        if spike_detected:
            max_spike = max(abs(p - mean_pred) / mean_pred for p in preds_30)

        # =====================================================
        # FESTIVAL NEAR SPIKE
        # =====================================================

        if spike_detected:
            festival_near = detect_festival_near_spikes(
                spike_days,
                base_date,
                festival_df
            )
        else:
            festival_near = "None"
        # =====================================================
        # SPIKE EXPLANATION
        # =====================================================

        # =====================================================
        # SPIKE EXPLANATION
        # =====================================================

        if spike_detected:

            spike_percent = round(max_spike * 100, 2)

            spike_explanation = (
                f"A demand spike has been detected for {sku}. "
                f"Demand deviates by approximately {spike_percent}% "
                f"from expected levels."
            )

            if festival_near != "None":
                spike_explanation += (
                    f" This spike may be associated with the upcoming "
                    f"festival(s): {festival_near}."
                )

        else:

            spike_explanation = (
                f"No abnormal demand spikes were detected for {sku}. "
                f"Demand remains stable."
            )
        # =====================================================
        # FESTIVAL
        # =====================================================

        
        festival_link = (
            f"The spike may be influenced by the nearby festival: {festival_near}"
            if spike_detected and festival_near != "None"
            else "No festival-driven spike detected."
        )

        # =====================================================
        # BASIC EXPLANATIONS
        # =====================================================

        demand_expl = f"Demand for {sku} is predicted using the Transformer time-series model trained on historical sales patterns."

        inventory_expl = f"Based on demand variability, order {int(eoq)} units and reorder when inventory reaches {int(rop)} units with an estimated lead time of {lead_time} days."

        rows.append({
            "SKU_ID": sku,
            "Nearby_Festival": festival_near,
            "Forecasted_Demand": round(monthly_demand, 2),
            "Predicted_Demand": round(monthly_demand, 2),
            "EOQ": int(eoq),
            "ROP": int(rop),
            "Lead_Time": lead_time,
            "Spike_Detected": spike_detected,
            "Spike_Days": spike_days,
            "Max_Spike_Multiplier": max_spike,
            "Festival_Spike_Link": festival_link,
            "Demand_Explanation": demand_expl,
            "Inventory_Explanation": inventory_expl,
            "Spike_Explanation": spike_explanation
        })

    forecast_df = pd.DataFrame(rows)

    # ==========================================================
    # LLM EXPLANATIONS
    # ==========================================================

    client = Groq(api_key=groq_api_key)

    manager_reports = []

    for _, row in forecast_df.iterrows():

        prompt = f"""
You are a senior retail demand analyst.

SKU: {row['SKU_ID']}
Predicted Monthly Demand: {row['Forecasted_Demand']}
EOQ: {row['EOQ']}
ROP: {row['ROP']}
Spike Info: {row['Spike_Detected']}

Explain demand and inventory insights in 5 sections.
Keep under 200 words.
End with: End of report.
"""

        try:

            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role":"user","content":prompt}],
                temperature=0.5,
                max_tokens=500
            )

            manager_reports.append(
                response.choices[0].message.content.strip()
            )

        except Exception as e:

            manager_reports.append(f"LLM error: {str(e)}")

    forecast_df["Manager_Explanation"] = manager_reports

    return forecast_df  
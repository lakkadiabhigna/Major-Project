# # backend/server.py

# import os
# import json
# from datetime import datetime, timedelta

# import joblib
# import pandas as pd
# import numpy as np
# import shap
# import tensorflow as tf

# import bcrypt
# import jwt
# import uvicorn
# from dotenv import load_dotenv
# from pymongo import MongoClient

# from fastapi import FastAPI, UploadFile, File, Response, Request
# from fastapi.responses import JSONResponse
# from fastapi.middleware.cors import CORSMiddleware

# from groq import Groq
# from pipelines.auto_selector import run_auto_forecasting_pipeline

# # ============================================================
# # LOAD ENV + CONNECT MONGODB (ATLAS)
# # ============================================================

# load_dotenv()

# MONGO_URI = os.getenv("MONGO_URI")
# if not MONGO_URI:
#     raise RuntimeError("MONGO_URI is missing in .env")

# mongo_client = MongoClient(MONGO_URI)
# mongo_db = mongo_client[os.getenv("MONGO_DB", "optimind")]
# users_collection = mongo_db["users"]

# print("✅ MongoDB connected (Atlas)")

# # ============================================================
# # INITIALIZE APP
# # ============================================================

# app = FastAPI()
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
# # ============================================================
# # ✅ Step 4: AUTH (Signup/Login/Remember User using httpOnly cookie)
# # ============================================================

# JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
# COOKIE_NAME = "optimind_token"
# COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days

# def _create_token(email: str) -> str:
#     payload = {"email": email, "exp": datetime.utcnow() + timedelta(days=7)}
#     return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# def _verify_token(token: str):
#     return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

# @app.post("/api/auth/signup")
# async def signup(payload: dict, response: Response):
#     name = (payload.get("name") or "").strip()
#     email = (payload.get("email") or "").strip().lower()
#     password = payload.get("password") or ""

#     if not email or not password:
#         return JSONResponse({"ok": False, "message": "Email and password required"}, status_code=400)

#     if users_collection.find_one({"email": email}):
#         return JSONResponse({"ok": False, "message": "You already have an account. Please login."}, status_code=409)

#     pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

#     users_collection.insert_one({
#         "name": name,
#         "email": email,
#         "passwordHash": pw_hash,
#         "createdAt": datetime.utcnow(),
#     })

#     token = _create_token(email)
#     response.set_cookie(
#         key=COOKIE_NAME,
#         value=token,
#         httponly=True,
#         samesite="lax",
#         secure=False,  # set True only when using https
#         max_age=COOKIE_MAX_AGE,
#     )

#     return {"ok": True, "user": {"name": name, "email": email}}

# @app.post("/api/auth/login")
# async def login(payload: dict, response: Response):
#     email = (payload.get("email") or "").strip().lower()
#     password = payload.get("password") or ""

#     if not email or not password:
#         return JSONResponse({"ok": False, "message": "Email and password required"}, status_code=400)

#     user = users_collection.find_one({"email": email})
#     if not user:
#         return JSONResponse({"ok": False, "message": "Invalid email or password"}, status_code=401)

#     stored_hash = (user.get("passwordHash") or "").encode("utf-8")
#     if not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
#         return JSONResponse({"ok": False, "message": "Invalid email or password"}, status_code=401)

#     token = _create_token(email)
#     response.set_cookie(
#         key=COOKIE_NAME,
#         value=token,
#         httponly=True,
#         samesite="lax",
#         secure=False,
#         max_age=COOKIE_MAX_AGE,
#     )

#     return {"ok": True, "user": {"name": user.get("name", ""), "email": email}}

# @app.get("/api/auth/me")
# async def me(request: Request):
#     token = request.cookies.get(COOKIE_NAME)
#     if not token:
#         return JSONResponse({"ok": False, "message": "Not logged in"}, status_code=401)

#     try:
#         payload = _verify_token(token)
#         email = payload.get("email")

#         user = users_collection.find_one({"email": email}, {"_id": 0, "passwordHash": 0})
#         if not user:
#             return JSONResponse({"ok": False, "message": "User not found"}, status_code=401)

#         return {"ok": True, "user": user}
#     except Exception:
#         return JSONResponse({"ok": False, "message": "Session invalid"}, status_code=401)

# @app.post("/api/auth/logout")
# async def logout(response: Response):
#     response.delete_cookie(COOKIE_NAME)
#     return {"ok": True}

# # ============================================================
# # LOAD MODELS ON STARTUP (IMPORTANT)
# # ============================================================

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# MODEL_DIR = os.path.join(BASE_DIR, "models")

# print(f"🔄 Loading models from {MODEL_DIR}...")

# LSTM_MODEL = tf.keras.models.load_model(os.path.join(MODEL_DIR, "global_lstm_forecast_model.h5"))
# LSTM_SCALER_X = joblib.load(os.path.join(MODEL_DIR, "scaler_X.pkl"))
# LSTM_SCALER_Y = joblib.load(os.path.join(MODEL_DIR, "scaler_y.pkl"))
# LSTM_LE = joblib.load(os.path.join(MODEL_DIR, "sku_encoder.pkl"))

# TRANSFORMER_MODEL = tf.keras.models.load_model(os.path.join(MODEL_DIR, "m5_transformer.keras"))
# TRANSFORMER_SCALER = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))

# with open(os.path.join(MODEL_DIR, "config.json"), "r") as f:
#     TRANSFORMER_CONFIG = json.load(f)

# print("✅ Models loaded successfully")

# # ============================================================
# # MAIN FORECAST ENDPOINT
# # ============================================================
# def generate_dashboard_analysis(df):
#     try:
#         total_products = len(df)
#         avg_demand = float(df["Forecasted_Demand"].mean())

#         top_products = (
#             df.nlargest(5, "Forecasted_Demand")[
#                 ["SKU_ID", "Forecasted_Demand", "EOQ", "ROP", "Manager_Explanation"]
#             ].to_dict(orient="records")
#         )

#         low_products = (
#             df.nsmallest(5, "Forecasted_Demand")[
#                 ["SKU_ID", "Forecasted_Demand", "EOQ", "ROP", "Manager_Explanation"]
#             ].to_dict(orient="records")
#         )

#         demand_distribution = df["Forecasted_Demand"].tolist()

#         insights = []

#         if "Manager_Explanation" in df.columns:
#             insights = df[["Manager_Explanation"]].head(5).to_dict(orient="records")

#         alerts = generate_alerts(df)

#         analysis = {
#             "total_products": total_products,
#             "avg_demand": avg_demand,
#             "top_products": top_products,
#             "low_products": low_products,
#             "demand_distribution": demand_distribution,
#             "insights": insights,
#             "alerts": alerts
#         }

#         return analysis

#     except Exception as e:
#         print("❌ Analysis Error:", str(e))
#         return {}

# def generate_alerts(df):

#     alerts = []

#     # High demand alert
#     high_demand = df.nlargest(3, "Forecasted_Demand")

#     for _, row in high_demand.iterrows():
#         alerts.append({
#             "type": "high",
#             "sku": row["SKU_ID"],
#             "message": f"High demand predicted for {row['SKU_ID']}. Increase inventory."
#         })

#     # Low demand alert
#     low_demand = df.nsmallest(3, "Forecasted_Demand")

#     for _, row in low_demand.iterrows():
#         alerts.append({
#             "type": "low",
#             "sku": row["SKU_ID"],
#             "message": f"Low demand predicted for {row['SKU_ID']}. Consider promotions."
#         })

#     return alerts
    
# @app.post("/forecast")
# async def forecast(file: UploadFile = File(...)):
#     try:
#         print("📥 Received file:", file.filename)

#         df = pd.read_csv(file.file)
#         print("📊 Data shape:", df.shape)

#         print("🚀 Starting auto forecasting pipeline...")

#         groq_key = os.getenv("GROQ_API_KEY")
#         print("🔑 GROQ KEY LOADED:", groq_key)

#         result_df, model_type = run_auto_forecasting_pipeline(
#     df,
#     LSTM_MODEL,
#     LSTM_SCALER_X,
#     LSTM_SCALER_Y,
#     LSTM_LE,
#     TRANSFORMER_MODEL,
#     TRANSFORMER_SCALER,
#     TRANSFORMER_CONFIG,
#     os.getenv("GROQ_API_KEY"),
# )
#         dashboard_analysis = generate_dashboard_analysis(result_df)

#         print("✅ Pipeline finished. Rows:", len(result_df))

#         data_json = result_df.to_dict(orient="records")
#         csv_string = result_df.to_csv(index=False)

#         return JSONResponse(
#     content={
#         "status": "success",
#         "rows": len(result_df),
#         "model_type": model_type,
#         "data": data_json,
#         "csv": csv_string,
#         "analysis": dashboard_analysis
#     }
# )

#     except Exception as e:
#         print("❌ ERROR:", str(e))
#         return JSONResponse(
#             content={"status": "error", "message": str(e)},
#             status_code=500,
#         )

# # ============================================================
# # RUN SERVER (so "python server.py" actually starts FastAPI)
# # ============================================================

# if __name__ == "__main__":
#     port = int(os.getenv("PORT", "8000"))
#     uvicorn.run(app, host="0.0.0.0", port=port)


# # backend/server.py

import os
import json
from datetime import datetime, timedelta

import joblib
import pandas as pd
import numpy as np
import shap
import tensorflow as tf

import bcrypt
import jwt
import uvicorn
from dotenv import load_dotenv
from pymongo import MongoClient

from fastapi import FastAPI, UploadFile, File, Response, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from groq import Groq
from pipelines.auto_selector import run_auto_forecasting_pipeline

# ============================================================
# LOAD ENV + CONNECT MONGODB (ATLAS)
# ============================================================

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is missing in .env")

mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client[os.getenv("MONGO_DB", "optimind")]
users_collection = mongo_db["users"]

print("✅ MongoDB connected (Atlas)")

# ============================================================
# INITIALIZE APP
# ============================================================

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ============================================================
# ✅ Step 4: AUTH (Signup/Login/Remember User using httpOnly cookie)
# ============================================================

JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
COOKIE_NAME = "optimind_token"
COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days

def _create_token(email: str) -> str:
    payload = {"email": email, "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def _verify_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

@app.post("/api/auth/signup")
async def signup(payload: dict, response: Response):
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return JSONResponse({"ok": False, "message": "Email and password required"}, status_code=400)

    if users_collection.find_one({"email": email}):
        return JSONResponse({"ok": False, "message": "You already have an account. Please login."}, status_code=409)

    pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    users_collection.insert_one({
        "name": name,
        "email": email,
        "passwordHash": pw_hash,
        "createdAt": datetime.utcnow(),
    })

    token = _create_token(email)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # set True only when using https
        max_age=COOKIE_MAX_AGE,
    )

    return {"ok": True, "user": {"name": name, "email": email}}

@app.post("/api/auth/login")
async def login(payload: dict, response: Response):
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return JSONResponse({"ok": False, "message": "Email and password required"}, status_code=400)

    user = users_collection.find_one({"email": email})
    if not user:
        return JSONResponse({"ok": False, "message": "Invalid email or password"}, status_code=401)

    stored_hash = (user.get("passwordHash") or "").encode("utf-8")
    if not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
        return JSONResponse({"ok": False, "message": "Invalid email or password"}, status_code=401)

    token = _create_token(email)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=COOKIE_MAX_AGE,
    )

    return {"ok": True, "user": {"name": user.get("name", ""), "email": email}}

@app.get("/api/auth/me")
async def me(request: Request):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return JSONResponse({"ok": False, "message": "Not logged in"}, status_code=401)

    try:
        payload = _verify_token(token)
        email = payload.get("email")

        user = users_collection.find_one({"email": email}, {"_id": 0, "passwordHash": 0})
        if not user:
            return JSONResponse({"ok": False, "message": "User not found"}, status_code=401)

        return {"ok": True, "user": user}
    except Exception:
        return JSONResponse({"ok": False, "message": "Session invalid"}, status_code=401)

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return {"ok": True}

# ============================================================
# LOAD MODELS ON STARTUP (IMPORTANT)
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

print(f"🔄 Loading models from {MODEL_DIR}...")

LSTM_MODEL = tf.keras.models.load_model(os.path.join(MODEL_DIR, "global_lstm_forecast_model.h5"))
LSTM_SCALER_X = joblib.load(os.path.join(MODEL_DIR, "scaler_X.pkl"))
LSTM_SCALER_Y = joblib.load(os.path.join(MODEL_DIR, "scaler_y.pkl"))
LSTM_LE = joblib.load(os.path.join(MODEL_DIR, "sku_encoder.pkl"))

TRANSFORMER_MODEL = tf.keras.models.load_model(os.path.join(MODEL_DIR, "m5_transformer.keras"))
TRANSFORMER_SCALER = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))

with open(os.path.join(MODEL_DIR, "config.json"), "r") as f:
    TRANSFORMER_CONFIG = json.load(f)

print("✅ Models loaded successfully")

# ============================================================
# MAIN FORECAST ENDPOINT
# ============================================================
def generate_dashboard_analysis(df):
    try:
        total_products = len(df)
        avg_demand = float(df["Forecasted_Demand"].mean())

        top_products = (
            df.nlargest(5, "Forecasted_Demand")[
                ["SKU_ID", "Forecasted_Demand", "EOQ", "ROP", "Manager_Explanation"]
            ].to_dict(orient="records")
        )

        low_products = (
            df.nsmallest(5, "Forecasted_Demand")[
                ["SKU_ID", "Forecasted_Demand", "EOQ", "ROP", "Manager_Explanation"]
            ].to_dict(orient="records")
        )

        demand_distribution = df["Forecasted_Demand"].tolist()

        insights = []

        if "Manager_Explanation" in df.columns:
            insights = df[["Manager_Explanation"]].head(5).to_dict(orient="records")

        alerts = generate_alerts(df)

        analysis = {
            "total_products": total_products,
            "avg_demand": avg_demand,
            "top_products": top_products,
            "low_products": low_products,
            "demand_distribution": demand_distribution,
            "insights": insights,
            "alerts": alerts
        }

        return analysis

    except Exception as e:
        print("❌ Analysis Error:", str(e))
        return {}

def generate_transformer_analysis(df):

    try:

        total_products = len(df)

        avg_predicted_demand = float(df["Predicted_Demand"].mean())

        top_products = (
            df.nlargest(5, "Predicted_Demand")[
                ["SKU_ID", "Predicted_Demand", "Manager_Explanation"]
            ].to_dict(orient="records")
        )

        low_products = (
            df.nsmallest(5, "Predicted_Demand")[
                ["SKU_ID", "Predicted_Demand", "Manager_Explanation"]
            ].to_dict(orient="records")
        )

        demand_distribution = df["Predicted_Demand"].tolist()

        insights = (
            df[["SKU_ID", "Manager_Explanation"]]
            .head(5)
            .to_dict(orient="records")
        )

        analysis = {
            "total_products": total_products,
            "avg_predicted_demand": avg_predicted_demand,
            "top_products": top_products,
            "low_products": low_products,
            "demand_distribution": demand_distribution,
            "insights": insights
        }

        return analysis

    except Exception as e:
        print("❌ Transformer Analysis Error:", str(e))
        return {}
    

def generate_alerts(df):

    alerts = []

    # High demand alert
    high_demand = df.nlargest(3, "Forecasted_Demand")

    for _, row in high_demand.iterrows():
        alerts.append({
            "type": "high",
            "sku": row["SKU_ID"],
            "message": f"High demand predicted for {row['SKU_ID']}. Increase inventory."
        })

    # Low demand alert
    low_demand = df.nsmallest(3, "Forecasted_Demand")

    for _, row in low_demand.iterrows():
        alerts.append({
            "type": "low",
            "sku": row["SKU_ID"],
            "message": f"Low demand predicted for {row['SKU_ID']}. Consider promotions."
        })

    return alerts
    
@app.post("/forecast")
async def forecast(file: UploadFile = File(...)):
    try:
        print("📥 Received file:", file.filename)

        df = pd.read_csv(file.file)
        print("📊 Data shape:", df.shape)

        print("🚀 Starting auto forecasting pipeline...")

        groq_key = os.getenv("GROQ_API_KEY")
        print("🔑 GROQ KEY LOADED:", groq_key)

        result_df, model_type = run_auto_forecasting_pipeline(
    df,
    LSTM_MODEL,
    LSTM_SCALER_X,
    LSTM_SCALER_Y,
    LSTM_LE,
    TRANSFORMER_MODEL,
    TRANSFORMER_SCALER,
    TRANSFORMER_CONFIG,
    os.getenv("GROQ_API_KEY"),
)
        dashboard_analysis = generate_dashboard_analysis(result_df)

        if model_type == "lstm":
            dashboard_analysis = generate_dashboard_analysis(result_df)
        else:
            dashboard_analysis = generate_transformer_analysis(result_df)

        print("✅ Pipeline finished. Rows:", len(result_df))

        data_json = result_df.to_dict(orient="records")
        csv_string = result_df.to_csv(index=False)

        return JSONResponse(
    content={
        "status": "success",
        "rows": len(result_df),
        "model_type": model_type,
        "data": data_json,
        "csv": csv_string,
        "analysis": dashboard_analysis
    }
)

    except Exception as e:
        print("❌ ERROR:", str(e))
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500,
        )

# ============================================================
# RUN SERVER (so "python server.py" actually starts FastAPI)
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
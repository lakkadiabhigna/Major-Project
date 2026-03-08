# # pipelines/auto_selector.py

# from pipelines.lstm_pipeline import run_optimind_pipeline
# from pipelines.transformer_pipeline import run_m5_transformer_full_pipeline


# def run_auto_forecasting_pipeline(
#     df,
#     lstm_model,
#     lstm_scaler_X,
#     lstm_scaler_y,
#     lstm_le,
#     transformer_model,
#     transformer_scaler,
#     transformer_config,
#     groq_api_key
# ):
#     # Smarter format-based detection
#     if any(col.startswith("d_") for col in df.columns):
#         print("🚀 Detected M5 format. Running Transformer pipeline...")
#         return run_m5_transformer_full_pipeline(
#             df,
#             transformer_model,
#             transformer_scaler,
#             transformer_config,
#             groq_api_key
#         )

#     elif "Date" in df.columns and "Units_Sold" in df.columns:
#         print("🚀 Detected Optimind format. Running LSTM pipeline...")
#         return run_optimind_pipeline(
#             df,
#             lstm_model,
#             lstm_scaler_X,
#             lstm_scaler_y,
#             lstm_le,
#             groq_api_key
#         )

#     else:
#         raise ValueError("Unsupported dataset format.")
    
# pipelines/auto_selector.py

from pipelines.lstm_pipeline import run_optimind_pipeline
from pipelines.transformer_pipeline import run_m5_transformer_full_pipeline


def run_auto_forecasting_pipeline(
    df,
    lstm_model,
    lstm_scaler_X,
    lstm_scaler_y,
    lstm_le,
    transformer_model,
    transformer_scaler,
    transformer_config,
    groq_api_key
):

    if any(col.startswith("d_") for col in df.columns):
        print("🚀 Detected M5 format. Running Transformer pipeline...")

        result_df = run_m5_transformer_full_pipeline(
            df,
            transformer_model,
            transformer_scaler,
            transformer_config,
            groq_api_key
        )

        return result_df, "transformer"


    elif "Date" in df.columns and "Units_Sold" in df.columns:
        print("🚀 Detected Optimind format. Running LSTM pipeline...")

        result_df = run_optimind_pipeline(
            df,
            lstm_model,
            lstm_scaler_X,
            lstm_scaler_y,
            lstm_le,
            groq_api_key
        )

        return result_df, "lstm"

    else:
        raise ValueError("Unsupported dataset format.")
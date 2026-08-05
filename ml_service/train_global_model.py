import json
import numpy as np
import os
import joblib
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def train_global_model():
    seed_path = os.path.join(os.path.dirname(__file__), 'models', 'seed_sessions.json')
    if not os.path.exists(seed_path):
        raise FileNotFoundError(f"Seed sessions data not found at {seed_path}")

    with open(seed_path, 'r') as f:
        sessions = json.load(f)

    grouped = {}
    for s in sessions:
        cif = s["cif"]
        if cif not in grouped:
            grouped[cif] = []
        grouped[cif].append(s)

    customer_baselines = {}
    engineered_dataset = []

    for cif, user_sessions in grouped.items():
        hours = []
        speeds = []
        depths = []

        for s in user_sessions:
            dt = datetime.fromisoformat(s["loginTimestamp"].replace('Z', ''))
            hours.append(dt.hour)
            speeds.append(s["typingSpeedAvg"])
            depths.append(s["navigationDepth"])

        customer_baselines[cif] = {
            "mean_login_hour": float(np.mean(hours)),
            "mean_typing_speed": float(np.mean(speeds)),
            "mean_navigation_depth": float(np.mean(depths))
        }

    for cif, user_sessions in grouped.items():
        base = customer_baselines[cif]
        for s in user_sessions:
            dt = datetime.fromisoformat(s["loginTimestamp"].replace('Z', ''))
            hour = dt.hour
            
            login_hour = float(hour)
            login_time_deviation = float(abs(hour - base["mean_login_hour"]))
            amount_ratio = 1.0
            is_new_device = 0.0
            is_new_ip = 0.0
            is_new_location = 0.0
            typing_variance = float(s["typingVariance"])
            typing_deviation = float(abs(s["typingSpeedAvg"] - base["mean_typing_speed"]))
            navigation_depth = float(s["navigationDepth"])
            navigation_deviation = float(abs(s["navigationDepth"] - base["mean_navigation_depth"]))
            actions_per_minute = float(s["actionsPerMinute"])
            idle_periods = float(s["idlePeriods"])
            copy_paste_detected = 1.0 if s["copyPasteDetected"] else 0.0

            feature_vector = [
                login_hour,
                login_time_deviation,
                amount_ratio,
                is_new_device,
                is_new_ip,
                is_new_location,
                typing_variance,
                typing_deviation,
                navigation_depth,
                navigation_deviation,
                actions_per_minute,
                idle_periods,
                copy_paste_detected
            ]
            engineered_dataset.append(feature_vector)

    X = np.array(engineered_dataset)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        contamination=0.08,
        n_estimators=100,
        max_samples='auto',
        random_state=42
    )
    model.fit(X_scaled)

    saved_models_dir = os.path.join(os.path.dirname(__file__), 'saved_models')
    os.makedirs(saved_models_dir, exist_ok=True)
    model_path = os.path.join(saved_models_dir, 'behavioral_global.pkl')

    joblib.dump({
        "global_model": model,
        "global_scaler": scaler,
        "model_version": "1.0.0",
        "feature_version": "v1.0"
    }, model_path)

    print(f"Global Isolation Forest trained on {X.shape[0]} samples.")
    print(f"Model successfully saved inside {model_path}")

if __name__ == "__main__":
    train_global_model()

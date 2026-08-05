"""Train the global and ten personal behavioral models for prototype accounts."""
import os
import sys
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

sys.path.insert(0, os.path.dirname(__file__))
from models.behavioral_engine import BehavioralTrustEngine

ACCOUNTS = [
    ('CIF100000', 12, 18), ('CIF100001', 9, 17), ('CIF100002', 18, 22),
    ('CIF100003', 7, 11), ('CIF100004', 10, 16), ('CIF100005', 13, 19),
    ('CIF100006', 11, 17), ('CIF100007', 12, 18), ('CIF100008', 8, 14),
    ('CIF100009', 14, 20),
]

def baseline_features(index, start, end):
    features = []
    for session in range(72):
        hour = start + (session % max(1, end - start))
        speed = 190 + index * 11 + (session % 5) * 3
        features.append({
            'login_hour': hour, 'login_time_deviation': 0.5 + (session % 3) * 0.2,
            'amount_ratio': 1.0 + (session % 4) * 0.03, 'is_new_device': False,
            'is_new_ip': False, 'is_new_location': False,
            'typing_variance': 18 + index * 2 + (session % 4),
            'typing_deviation': abs(speed - (196 + index * 11)),
            'navigation_depth': 3 + (session % 3), 'navigation_deviation': 0.3,
            'actions_per_minute': 8 + index + (session % 4),
            'idle_periods': session % 2, 'copy_paste_detected': False,
        })
    return features

def main():
    engine = BehavioralTrustEngine()
    all_features = []
    per_account = {}
    for index, (cif, start, end) in enumerate(ACCOUNTS):
        per_account[cif] = baseline_features(index, start, end)
        all_features.extend(per_account[cif])

    vectors = np.array([engine.extract_feature_vector(item) for item in all_features])
    scaler = StandardScaler().fit(vectors)
    model = IsolationForest(contamination=0.08, n_estimators=100, random_state=42).fit(scaler.transform(vectors))
    os.makedirs(engine.models_dir, exist_ok=True)
    joblib.dump({'global_model': model, 'global_scaler': scaler, 'model_version': 'prototype-1.0', 'feature_version': 'v1.0'}, os.path.join(engine.models_dir, 'behavioral_global.pkl'))

    engine.load_models()
    for cif, features in per_account.items():
        engine.train_personal_model(cif, features)
    print(f'Trained one global and {len(per_account)} personal behavioral models from {len(all_features)} baseline sessions.')

if __name__ == '__main__':
    main()

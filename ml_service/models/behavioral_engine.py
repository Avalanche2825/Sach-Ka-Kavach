"""
Behavioral Trust Engine — Module 1 of SACH Kavach
Exposes Isolation Forest anomaly detection based on 13 engineered features.
"""

import numpy as np
import joblib
import os
import json
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

class BehavioralTrustEngine:
    FEATURE_NAMES = [
        'login_hour',
        'login_time_deviation',
        'amount_ratio',
        'is_new_device',
        'is_new_ip',
        'is_new_location',
        'typing_variance',
        'typing_deviation',
        'navigation_depth',
        'navigation_deviation',
        'actions_per_minute',
        'idle_periods',
        'copy_paste_detected'
    ]

    def __init__(self):
        self.global_model = None
        self.global_scaler = None
        self.customer_baselines = {}
        self.personal_models_cache = {}
        self.models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'saved_models')
        
        # Load Shared Configuration
        self.config = {}
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'shared_config.json')
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    self.config = json.load(f)
            except Exception as e:
                print(f"[ML Engine] Failed to load config from {config_path}: {e}")

    def load_models(self):
        """Load the baseline global model."""
        global_path = os.path.join(self.models_dir, 'behavioral_global.pkl')
        if os.path.exists(global_path):
            try:
                state = joblib.load(global_path)
                self.global_model = state.get("global_model")
                self.global_scaler = state.get("global_scaler")
                print(f"[ML Engine] Loaded global model.")
            except Exception as e:
                print(f"[ML Engine] Error loading global model: {e}")
        else:
            print(f"[ML Engine] Warning: global model file not found at {global_path}")

    def load_personal_model(self, cif: str) -> dict:
        """Attempts to load a customer's personal model from cache or disk."""
        if cif in self.personal_models_cache:
            return self.personal_models_cache[cif]

        personal_path = os.path.join(self.models_dir, f"behavioral_{cif}.pkl")
        if os.path.exists(personal_path):
            try:
                state = joblib.load(personal_path)
                self.personal_models_cache[cif] = {
                    "model": state["personal_model"],
                    "scaler": state["personal_scaler"]
                }
                print(f"[ML Engine] Loaded and cached personal model for customer {cif}")
                return self.personal_models_cache[cif]
            except Exception as e:
                print(f"[ML Engine] Error loading personal model for {cif}: {e}")
        
        return None

    def extract_feature_vector(self, features_dict: dict) -> list:
        """Translates a dictionary of features into the strictly ordered 13-feature array."""
        vector = []
        for name in self.FEATURE_NAMES:
            val = features_dict.get(name, 0.0)
            if isinstance(val, bool):
                val = 1.0 if val else 0.0
            vector.append(float(val))
        return vector

    def train_personal_model(self, cif: str, engineered_features_list: list):
        """
        Trains a personalized Isolation Forest model for a customer on their historical engineered features.
        Saves the resulting model to disk and caches it.
        """
        if len(engineered_features_list) < 5:
            print(f"[ML Engine] Skipping personal training for {cif}: insufficient sessions.")
            return

        try:
            X = np.array([self.extract_feature_vector(f) for f in engineered_features_list])
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            model = IsolationForest(
                contamination=0.08,
                n_estimators=100,
                max_samples='auto',
                random_state=42
            )
            model.fit(X_scaled)

            personal_path = os.path.join(self.models_dir, f"behavioral_{cif}.pkl")
            joblib.dump({
                "personal_model": model,
                "personal_scaler": scaler,
                "feature_version": "v1.0"
            }, personal_path)

            self.personal_models_cache[cif] = {
                "model": model,
                "scaler": scaler
            }
            print(f"[ML Engine] Personal model successfully trained and saved for {cif}")
        except Exception as e:
            print(f"[ML Engine] Error training personal model for {cif}: {e}")

    def score(self, cif: str, features_dict: dict, profile_confidence: float = 0.0) -> dict:
        """
        Scores a session payload.
        Combines predictions from both the global model and a customer's personal model
        using profile_confidence as the ensemble interpolation weight.
        """
        features = self.extract_feature_vector(features_dict)
        factors = []
        model_used = 'global_model'

        # 1. Run Global Model scoring
        if self.global_model and self.global_scaler:
            try:
                global_X = self.global_scaler.transform([features])
                score_global = float(self.global_model.decision_function(global_X)[0])
            except Exception as e:
                print(f"[ML Engine] Global model prediction error: {e}")
                score_global = 0.0
        else:
            score_global = 0.0

        # 2. Run Personal Model scoring if trained
        personal_entry = self.load_personal_model(cif)
        if personal_entry:
            try:
                personal_model = personal_entry["model"]
                personal_scaler = personal_entry["scaler"]
                personal_X = personal_scaler.transform([features])
                score_personal = float(personal_model.decision_function(personal_X)[0])
                model_used = 'ensemble_personal_global'
            except Exception as e:
                print(f"[ML Engine] Personal model prediction error for {cif}: {e}")
                score_personal = score_global
                model_used = 'global_model'
        else:
            score_personal = score_global
            model_used = 'global_model'

        # 3. Soft Ensemble combination using Profile Confidence weight
        combined_raw_score = (1.0 - profile_confidence) * score_global + profile_confidence * score_personal

        if self.global_model is None:
            return {
                "risk_score": 10,
                "factors": ["Model offline, using baseline fallback"],
                "model_used": "fallback",
                "cold_start": True
            }

        try:
            # 4. Mathematically defensible normalization of the Isolation Forest anomaly score.
            # Isolation Forest decision_function() output spans approximately [-0.5, 0.5].
            # s_max = 0.5 (most normal/inlier), s_min = -0.5 (most anomalous/outlier).
            # Normalized score spans [0.0 (normal) to 1.0 (highly abnormal)]:
            # normalized_score = (s_max - s) / (s_max - s_min) = (0.5 - s) / 1.0
            normalized_score = 0.5 - combined_raw_score
            normalized_score = max(0.0, min(1.0, normalized_score))
            
            # Map normalized score to [0 - 40] range:
            risk_score = int(round(normalized_score * 40.0))
            
            if features_dict.get('is_new_device'):
                factors.append("Session initiated from unrecognized device signature")
            if features_dict.get('is_new_ip') or features_dict.get('is_new_location'):
                factors.append("Geographic or network origin deviates from customer login history")
            if features_dict.get('login_time_deviation', 0.0) > 4.0:
                factors.append("Session login hour deviates significantly from normal pattern")
            if features_dict.get('typing_deviation', 0.0) > 60.0:
                factors.append("Typing speed speed cadence shows abnormal variance deviation")
            if features_dict.get('copy_paste_detected'):
                factors.append("Suspicious clipboard copy-paste events recorded on transaction input")

            return {
                "risk_score": risk_score,
                "factors": factors,
                "model_used": model_used,
                "cold_start": (profile_confidence < 0.3)
            }
        except Exception as e:
            print(f"[ML Engine] Error scoring session for {cif}: {e}")
            return {
                "risk_score": 15,
                "factors": [f"Error during scoring: {str(e)}"],
                "model_used": "fallback",
                "cold_start": True
            }

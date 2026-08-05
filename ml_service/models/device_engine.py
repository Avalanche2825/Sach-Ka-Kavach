"""
Device & Access Intelligence Engine — SACH Kavach Module 2

100-Tree Random Forest Classifier evaluating device signatures, hardware fingerprints,
IP reputation, impossible travel, virtualized environments, SIM swap recency, and access velocity.

Outputs Device Risk Score: 0–25 (Capped Risk Budget)
"""

import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier


class DeviceTrustEngine:

    FEATURE_NAMES = [
        'is_new_device',
        'is_new_browser',
        'is_new_os',
        'is_new_network',
        'is_new_isp',
        'is_new_asn',
        'geo_distance_km',
        'impossible_travel',
        'vpn_detected',
        'proxy_or_datacenter',
        'is_emulator_or_vm',
        'sim_swap_recent_72h',
        'access_velocity',
        'behavior_trust_score'
    ]

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42,
            class_weight='balanced'
        )
        self._train_on_synthetic_baseline()

    def _train_on_synthetic_baseline(self):
        """
        Train Random Forest Classifier (100 trees) on 14 device access risk features.
        Target: 0 (Trusted Access) vs 1 (Risky Access Environment)
        """
        X = np.array([
            # Trusted Access Profiles [new_dev, new_br, new_os, new_net, new_isp, new_asn, dist_km, imp_travel, vpn, proxy, emu, sim72, vel, beh_score]
            [0, 0, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, 1, 10],
            [0, 0, 0, 0, 0, 0, 5.2, 0, 0, 0, 0, 0, 1, 8],
            [0, 1, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, 1, 12],
            [1, 0, 0, 0, 0, 0, 12.0, 0, 0, 0, 0, 0, 2, 14],
            [0, 0, 0, 1, 0, 0, 25.0, 0, 0, 0, 0, 0, 1, 5],
            [0, 0, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, 3, 15],
            [1, 1, 0, 0, 0, 0, 0.0, 0, 0, 0, 0, 0, 1, 10],
            [0, 0, 1, 0, 0, 0, 8.0, 0, 0, 0, 0, 0, 2, 12],

            # High Risk / Anomaly Access Profiles
            [1, 1, 1, 1, 1, 1, 1200.0, 1, 1, 1, 0, 0, 8, 35],
            [1, 0, 0, 1, 1, 0, 450.0, 0, 1, 1, 1, 0, 6, 28],
            [0, 1, 1, 1, 1, 1, 2200.0, 1, 1, 1, 1, 0, 10, 38],
            [1, 1, 1, 1, 1, 1, 3500.0, 1, 1, 1, 1, 1, 12, 40],
            [1, 0, 1, 1, 1, 0, 850.0, 1, 0, 1, 1, 0, 7, 30],
            [0, 0, 0, 1, 1, 1, 0.0, 0, 1, 0, 0, 1, 4, 22],
            [1, 1, 0, 1, 1, 1, 600.0, 0, 1, 1, 1, 1, 9, 36],
            [0, 1, 1, 1, 1, 1, 1500.0, 1, 1, 1, 0, 1, 11, 39],
        ])
        y = np.array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1])
        self.model.fit(X, y)

    def score(self, signals: dict) -> dict:
        is_new_dev = int(bool(signals.get('is_new_device', False)))
        is_new_br = int(bool(signals.get('is_new_browser', False)))
        is_new_os = int(bool(signals.get('is_new_os', False)))
        is_new_net = int(bool(signals.get('is_new_network', False)))
        is_new_isp = int(bool(signals.get('is_new_isp', False)))
        is_new_asn = int(bool(signals.get('is_new_asn', False)))
        geo_dist = float(signals.get('geo_distance_km', 0.0))
        imp_travel = int(bool(signals.get('impossible_travel', False)))
        vpn = int(bool(signals.get('vpn_detected', False)))
        proxy = int(bool(signals.get('proxy_or_datacenter', False)))
        emu = int(bool(signals.get('is_emulator_or_vm', False)))
        sim_swap = int(bool(signals.get('sim_swap_recent_72h', False)))
        velocity = int(signals.get('access_velocity', 1))
        beh_score = float(signals.get('behavior_trust_score', 12.0))

        feature_vector = np.array([[
            is_new_dev, is_new_br, is_new_os, is_new_net, is_new_isp, is_new_asn,
            geo_dist, imp_travel, vpn, proxy, emu, sim_swap, velocity, beh_score
        ]])

        prob_risky = float(self.model.predict_proba(feature_vector)[0][1])

        # ── Budget Allocation Engine (Capped at 25 Max Risk Budget) ─────────────
        new_dev_risk = 8 if is_new_dev else 0
        ip_risk = 4 if (vpn or proxy) else 0
        location_risk = 4 if (imp_travel or geo_dist > 500) else (2 if geo_dist > 100 else 0)
        sim_swap_risk = 5 if sim_swap else 0
        emu_risk = 2 if emu else 0
        browser_os_risk = 2 if (is_new_br or is_new_os) else 0

        budget_sum = new_dev_risk + ip_risk + location_risk + sim_swap_risk + emu_risk + browser_os_risk
        
        # Combine Random Forest probability output with Budget Ceiling (Capped strictly to 25)
        rf_risk = int(round(prob_risky * 25.0))
        raw_score = max(rf_risk, budget_sum)
        device_risk_score = min(25, max(0, raw_score))

        # Risk Categories
        if device_risk_score >= 19:
            category = 'CRITICAL'
        elif device_risk_score >= 13:
            category = 'ELEVATED'
        elif device_risk_score >= 7:
            category = 'MODERATE'
        else:
            category = 'LOW'

        # Feature Importances Map
        importances = {
            name: round(float(imp), 3)
            for name, imp in zip(self.FEATURE_NAMES, self.model.feature_importances_)
        }

        # SOC Factor Explanations
        factors = []
        if sim_swap:
            factors.append("CRITICAL RULE BREACH: Carrier SIM swap registered within 72 hours — OTP verification disabled")
        if is_new_dev:
            factors.append("Unrecognized hardware device signature — SHA-256 fingerprint absent from trusted registry")
        if vpn:
            factors.append("Commercial VPN or TOR anonymizer exit node detected in routing path")
        elif proxy:
            factors.append("Datacenter or proxy IP infrastructure detected")
        if imp_travel:
            factors.append(f"Impossible travel speed vector detected: {geo_dist:.0f} km distance between sequential logins")
        elif geo_dist > 200:
            factors.append(f"Geographic access location deviation: {geo_dist:.0f} km from primary registered location")
        if emu:
            factors.append("Virtualized execution environment detected (Emulator / VirtualBox / Headless Browser)")
        if velocity >= 5:
            factors.append(f"High access velocity: {velocity} login attempts detected within 15-minute window")
        if is_new_br or is_new_os:
            factors.append("Browser or Operating System family differs from historical access baseline")

        if not factors:
            factors.append("Device hardware fingerprint, IP reputation, and access environment match trusted baseline")

        return {
            'device_risk_score': device_risk_score,
            'raw_probability': round(prob_risky, 3),
            'risk_category': category,
            'budget_allocations': {
                'newDeviceRisk': new_dev_risk,
                'ipReputationRisk': ip_risk,
                'locationRisk': location_risk,
                'simSwapRisk': sim_swap_risk,
                'emulatorRisk': emu_risk,
                'browserOSChangeRisk': browser_os_risk
            },
            'risk_factors': factors,
            'feature_importances': importances
        }

    def save(self, directory: str = 'ml_service/saved_models'):
        os.makedirs(directory, exist_ok=True)
        joblib.dump(self.model, os.path.join(directory, 'device_engine.pkl'))

    def load(self, directory: str = 'ml_service/saved_models'):
        path = os.path.join(directory, 'device_engine.pkl')
        if os.path.exists(path):
            self.model = joblib.load(path)

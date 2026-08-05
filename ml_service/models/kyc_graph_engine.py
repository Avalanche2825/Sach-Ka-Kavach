"""
Swarm Identity & Onboarding Fraud Detector — Module 3 of SACH Kavach

Detects coordinated fake account registration by analyzing relationships
between KYC applications: shared Aadhaar, shared device fingerprints,
shared IP addresses, and submission velocity clustering.

Key Innovation: Instead of validating Aadhaar in isolation,
we validate Aadhaar RELATIONSHIPS across all applications.
"""

from collections import defaultdict
from datetime import datetime, timedelta


class KYCGraphEngine:

    VELOCITY_THRESHOLD_COUNT = 3
    VELOCITY_WINDOW_MINUTES = 30

    def __init__(self):
        self.aadhaar_map = defaultdict(list)
        self.pan_map = defaultdict(list)
        self.device_map = defaultdict(list)
        self.ip_map = defaultdict(list)
        self.timestamp_log = []
        self.app_registry = {}

    def _normalize_aadhaar(self, aadhaar: str) -> str:
        if not aadhaar:
            return ''
        return str(aadhaar).strip().replace(' ', '').replace('-', '')

    def _normalize_pan(self, pan: str) -> str:
        if not pan:
            return ''
        return str(pan).strip().upper()

    def register_application(self, app: dict):
        app_id = str(app.get('_id', ''))
        self.app_registry[app_id] = app

        aadhaar = self._normalize_aadhaar(app.get('aadhaar', ''))
        pan = self._normalize_pan(app.get('pan', ''))
        device = app.get('deviceFingerprint', '')
        ip = app.get('ipAddress', '')

        if aadhaar:
            self.aadhaar_map[aadhaar].append(app_id)
        if pan:
            self.pan_map[pan].append(app_id)
        if device:
            self.device_map[device].append(app_id)
        if ip:
            self.ip_map[ip].append(app_id)

        try:
            ts = datetime.fromisoformat(app.get('timestamp', datetime.now().isoformat()))
        except (ValueError, TypeError):
            ts = datetime.now()
        self.timestamp_log.append((ts, app_id, app.get('name', '')))

    def analyze(self, new_app: dict) -> dict:
        suspicious_matches = []
        linked_apps = set()

        aadhaar = self._normalize_aadhaar(new_app.get('aadhaar', ''))
        pan = self._normalize_pan(new_app.get('pan', ''))
        device = new_app.get('deviceFingerprint', '')
        ip = new_app.get('ipAddress', '')

        # Aadhaar duplicate check
        if aadhaar and aadhaar in self.aadhaar_map:
            existing = self.aadhaar_map[aadhaar]
            if existing:
                existing_names = [
                    self.app_registry.get(aid, {}).get('name', 'Unknown')
                    for aid in existing
                ]
                suspicious_matches.append(
                    f"Aadhaar reuse: identity document already registered "
                    f"by '{', '.join(existing_names)}' — both accounts frozen pending verification"
                )
                linked_apps.update(existing)

        # PAN duplicate check
        if pan and pan in self.pan_map:
            existing = self.pan_map[pan]
            if existing:
                existing_names = [
                    self.app_registry.get(aid, {}).get('name', 'Unknown')
                    for aid in existing
                ]
                suspicious_matches.append(
                    f"PAN duplicate: tax identifier already used by '{', '.join(existing_names)}'"
                )
                linked_apps.update(existing)

        # Device fingerprint clustering
        if device and device in self.device_map:
            existing = self.device_map[device]
            if existing:
                suspicious_matches.append(
                    f"Device fingerprint shared across {len(existing) + 1} distinct applications — "
                    f"coordinated fraud ring signal"
                )
                linked_apps.update(existing)

        # IP address clustering
        if ip and ip in self.ip_map:
            existing = self.ip_map[ip]
            if len(existing) >= 2:
                suspicious_matches.append(
                    f"IP address associated with {len(existing) + 1} unique applicants — "
                    f"single origin submitting multiple identities"
                )
                linked_apps.update(existing)

        # Velocity check
        velocity_flag = False
        cutoff = datetime.now() - timedelta(minutes=self.VELOCITY_WINDOW_MINUTES)
        recent = [entry for entry in self.timestamp_log if entry[0] >= cutoff]
        if len(recent) >= self.VELOCITY_THRESHOLD_COUNT:
            velocity_flag = True
            suspicious_matches.append(
                f"Submission velocity alert: {len(recent)} applications within "
                f"{self.VELOCITY_WINDOW_MINUTES} minutes — automated or scripted pattern detected"
            )

        # Risk score calibration
        base_risk = 0
        if aadhaar and aadhaar in self.aadhaar_map and self.aadhaar_map[aadhaar]:
            base_risk += 70
        if pan and pan in self.pan_map and self.pan_map[pan]:
            base_risk += 50
        if suspicious_matches:
            base_risk += len(suspicious_matches) * 8
        if velocity_flag:
            base_risk += 20

        risk_score = min(100, base_risk)
        fraud_ring_detected = len(suspicious_matches) >= 2 or \
            bool(aadhaar and aadhaar in self.aadhaar_map and self.aadhaar_map[aadhaar])

        return {
            'suspicious_matches': suspicious_matches,
            'fraud_ring_detected': fraud_ring_detected,
            'linked_applications': list(linked_apps),
            'velocity_flag': velocity_flag,
            'risk_score': risk_score,
        }

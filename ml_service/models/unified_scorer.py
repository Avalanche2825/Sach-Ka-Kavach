"""
Unified Trust Scorer — SACH Kavach Bharat Trust Grid (100-Point Risk Budget)

Aggregates all 5 security modules:
  • Module 1: Behavioral Trust Engine            (0–40 Risk Points)
  • Module 2: Device & Access Intelligence       (0–25 Risk Points)
  • Module 3: Swarm Identity & Onboarding        (0–15 Risk Points)
  • Module 4: Secure Recovery Shield             (0–10 Risk Points)
  • Module 5: Privileged Access Governance        (0–10 Risk Points)

Total Maximum Risk Budget = 100 Points
Dynamic Trust Score = 100 - Total Risk Budget

Decision Matrix Policy:
  81 - 100  ALLOW           - Frictionless access
  61 - 80   OTP_REQUIRED    - Authentication token step-up
  41 - 60   ALERT           - Customer & SOC notification
  21 - 40   HOLD            - Escrow multi-sig freeze
   0 - 20   BLOCK           - Immediate access block & fraud alert
"""


class UnifiedScorer:

    RESPONSE_MATRIX = [
        (80, 'ALLOW',          'Approved',          'Frictionless access — all signals within normal security baseline.'),
        (60, 'OTP_REQUIRED',   'OTP_Required',      'Authentication token required before proceeding.'),
        (40, 'ALERT',          'CIF_Required',      'Security notification dispatched. Verification required.'),
        (20, 'HOLD',           'Escrow_Hold',       'Transaction held in escrow. Pending SOC review.'),
        (0,  'BLOCK',          'Rejected_Blocked',  'Access blocked. Fraud Operations & Risk Governance team alerted.'),
    ]

    def compute_final_score(self, module_scores: dict, risk_factors: list = None) -> dict:
        beh_risk = min(40, max(0, module_scores.get('behavioral', 0)))
        dev_risk = min(25, max(0, module_scores.get('device', 0)))
        id_risk = min(15, max(0, module_scores.get('identity', 0)))
        rec_risk = min(10, max(0, module_scores.get('recovery', 0)))
        emp_risk = min(10, max(0, module_scores.get('employee', 0)))

        # Hard Block Checks
        is_hard_blocked = False
        block_reason = None

        if risk_factors:
            for factor in risk_factors:
                f_str = str(factor)
                if 'SIM swap' in f_str or 'SIM_SWAP' in f_str:
                    is_hard_blocked = True
                    block_reason = "CRITICAL RULE BREACH: Carrier SIM swap registered within 72 hours."
                    break
                elif 'APPROVE_OWN_REQUEST' in f_str or 'self-approval' in f_str:
                    is_hard_blocked = True
                    block_reason = "CRITICAL INSIDER BREACH: Employee self-approval attempt detected."
                    break
                elif 'Duplicate Aadhaar' in f_str or 'Duplicate PAN' in f_str:
                    is_hard_blocked = True
                    block_reason = "CRITICAL IDENTITY FRAUD: Duplicate Aadhaar/PAN detected."
                    break

        # Calculate Total Combined Risk Budget (0-100)
        total_risk = min(100, max(0, beh_risk + dev_risk + id_risk + rec_risk + emp_risk))
        
        if is_hard_blocked:
            total_risk = 95 # Force high risk

        trust_score = max(0, min(100, 100 - total_risk))

        action, status, description = 'BLOCK', 'Rejected_Blocked', ''
        for threshold, act, stat, desc in self.RESPONSE_MATRIX:
            if trust_score >= threshold:
                action, status, description = act, stat, desc
                break

        if is_hard_blocked:
            action = 'BLOCK'
            status = 'Rejected_Blocked'
            description = block_reason or 'Access blocked by security policy hard rule.'

        return {
            'risk_score': total_risk,
            'trust_score': trust_score,
            'action': action,
            'status': status,
            'description': description,
            'module_breakdown': {
                'behavioral': beh_risk,
                'device': dev_risk,
                'identity': id_risk,
                'recovery': rec_risk,
                'employee': emp_risk
            }
        }

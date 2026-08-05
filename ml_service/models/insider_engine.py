"""
Privileged Access Governance Engine — Module 5 of SACH Kavach

Implements statistical behavioral baseline per employee.
Detects:
  - Actions performed outside standard business hours
  - Critical high-privilege actions without proper authorization
  - Compounding risk when both conditions apply simultaneously
  - Deviation from 30-day access baseline
"""

import numpy as np
from collections import defaultdict
from datetime import datetime


class InsiderThreatEngine:

    STANDARD_HOURS_START = 9
    STANDARD_HOURS_END = 18

    ACTION_RISK_WEIGHTS = {
        'Customer Records Search': 0,
        'View Account Statement': 0,
        'Update Contact Details': 5,
        'Process Loan Application': 5,
        'Generate Account Report': 5,
        'Routine Balance Lookup': 0,
        'Sensitive Record Access': 30,
        'Transaction Reversal': 30,
        'Account Status Change': 25,
        'Credit Limit Override': 40,
        'KYC Override': 40,
        'Account Closure': 40,
        'Bulk Customer Export': 45,
        'Bulk Data Export': 45,
        'Administrative Override': 50,
        'Suspicious Account Override': 50,
    }

    def __init__(self):
        self.baselines = defaultdict(lambda: {
            'hours': [],
            'actions': [],
            'account_segments': [],
            'daily_counts': defaultdict(int),
        })
        self.cross_access_graph = defaultdict(int)

    def record_action(self, employee_id: str, action: dict):
        baseline = self.baselines[employee_id]
        try:
            hour = datetime.fromisoformat(
                action.get('timestamp', datetime.now().isoformat())
            ).hour
        except (ValueError, TypeError):
            hour = datetime.now().hour

        baseline['hours'].append(hour)
        baseline['actions'].append(action.get('action', ''))
        baseline['account_segments'].append(action.get('segment', 'retail'))

        date_key = str(action.get('timestamp', ''))[:10]
        baseline['daily_counts'][date_key] += 1

        for key in ['hours', 'actions', 'account_segments']:
            if len(baseline[key]) > 90:
                baseline[key] = baseline[key][-90:]

    def score(self, employee_id: str, action: dict) -> dict:
        risk_score = 15
        factors = []

        try:
            ts = datetime.fromisoformat(
                action.get('timestamp', datetime.now().isoformat())
            )
            hour = ts.hour
        except (ValueError, TypeError):
            hour = datetime.now().hour

        outside_hours = (hour < self.STANDARD_HOURS_START or hour >= self.STANDARD_HOURS_END)

        if outside_hours:
            risk_score += 30
            factors.append(
                f"Action performed at {hour:02d}:00 — outside standard operational hours "
                f"({self.STANDARD_HOURS_START:02d}:00-{self.STANDARD_HOURS_END:02d}:00)"
            )

        action_name = action.get('action', '')
        action_weight = self.ACTION_RISK_WEIGHTS.get(action_name, 0)

        if action_weight > 0:
            risk_score += action_weight
            if action_weight >= 40:
                factors.append(
                    f"High-privilege action detected: '{action_name}' "
                    f"requires dual authorization under Four-Eyes Protocol"
                )
            else:
                factors.append(
                    f"Elevated-risk action: '{action_name}' flagged for compliance logging"
                )

        if outside_hours and action_weight >= 30:
            risk_score += 20
            factors.append(
                "Compounding risk: critical action combined with off-hours access — "
                "elevated insider threat signal"
            )

        segment = action.get('customer_segment', 'retail')
        if segment == 'hni' and action_weight >= 25:
            risk_score += 15
            factors.append(
                "High-net-worth customer data accessed during a privileged operation — elevated sensitivity"
            )

        baseline = self.baselines.get(employee_id)
        if baseline and len(baseline['hours']) >= 10:
            avg_hour = np.mean(baseline['hours'])
            hour_std = np.std(baseline['hours'])
            if hour_std > 0:
                z_score = abs(hour - avg_hour) / hour_std
                if z_score > 2.5:
                    risk_score += 10
                    factors.append(
                        f"Access time deviates {z_score:.1f} standard deviations "
                        f"from this employee's 30-day personal pattern"
                    )

            date_key = str(action.get('timestamp', ''))[:10]
            if baseline['daily_counts'].get(date_key, 0) > 20:
                risk_score += 10
                factors.append("Unusually high action volume detected for this employee today")

        risk_score = min(100, risk_score)

        requires_manager = risk_score > 40 or action_weight >= 30
        requires_escalation = risk_score > 70

        if requires_escalation:
            recommended = "ESCALATE — Alert SOC and Compliance immediately. Suspend access pending review."
        elif requires_manager:
            recommended = "HOLD — Require manager dual-authorization before proceeding (Four-Eyes Protocol)."
        else:
            recommended = "LOG — Action within acceptable parameters. Audit trail updated."

        return {
            'risk_score': risk_score,
            'risk_factors': factors,
            'requires_manager_approval': requires_manager,
            'requires_escalation': requires_escalation,
            'recommended_action': recommended,
        }

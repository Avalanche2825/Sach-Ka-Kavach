"""
SACH Kavach — Python ML Microservice
FastAPI server exposing all trained ML model endpoints.
Consumed internally by the Node.js Express server on port 5001.
"""

import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException, Body, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

sys.path.insert(0, os.path.dirname(__file__))

from models.behavioral_engine import BehavioralTrustEngine
from models.device_engine import DeviceTrustEngine
from models.insider_engine import InsiderThreatEngine
from models.text_risk_engine import TextRiskEngine
from models.kyc_graph_engine import KYCGraphEngine
from models.unified_scorer import UnifiedScorer

app = FastAPI(title="SACH Kavach ML Engine API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PORT = int(os.environ.get('PORT', os.environ.get('ML_PORT', 5001)))

print("\n=== SACH Kavach ML Engine Initializing ===")
behavioral = BehavioralTrustEngine()
device_engine = DeviceTrustEngine()
insider = InsiderThreatEngine()
text_risk = TextRiskEngine()
kyc_graph = KYCGraphEngine()
unified = UnifiedScorer()

behavioral.load_models()
print("  Behavioral Engine:  Isolation Forest — READY")
print(f"  Device Engine:      Random Forest ({device_engine.model.n_estimators} estimators) — READY")
print("  Insider Engine:     Statistical Baseline Scorer — READY")
print("  KYC Graph Engine:   Relationship Graph Analyzer — READY")
print("  Unified Scorer:     Weighted Aggregator — READY")
print("===========================================\n")


class BehavioralScoreRequest(BaseModel):
    cif: str
    features: Dict[str, Any]
    profile_confidence: Optional[float] = 0.0

class BehavioralTrainRequest(BaseModel):
    cif: str
    historical_features: List[Dict[str, Any]]


@app.get('/health')
def health():
    return {
        'status': 'active',
        'service': 'SACH Kavach ML Engine',
        'port': PORT,
        'models': {
            'behavioral': 'Isolation Forest (13 Features)',
            'device': 'Random Forest',
            'insider': 'Statistical Baseline',
            'text_risk': 'Sentence-Transformers / Keyword Fallback',
            'kyc_graph': 'Relationship Graph',
            'unified': 'Weighted Aggregator',
        }
    }


@app.post('/score/behavioral')
def score_behavioral(payload: BehavioralScoreRequest, x_correlation_id: Optional[str] = Header(None)):
    """
    Score a customer session for behavioral anomalies using 13 features.
    """
    print(f"[ML Engine][Correlation ID: {x_correlation_id}] Scoring behavioral signals for customer {payload.cif}")
    result = behavioral.score(payload.cif, payload.features, payload.profile_confidence or 0.0)
    result["correlation_id"] = x_correlation_id
    return result


@app.post('/train/behavioral')
def train_behavioral(payload: BehavioralTrainRequest):
    """
    Train a personalized Isolation Forest model for a customer using their historical sessions.
    """
    behavioral.train_personal_model(payload.cif, payload.historical_features)
    return {"success": True, "message": f"Personal model trained for customer {payload.cif}"}


@app.post('/score/device')
def score_device(payload: Dict[str, Any] = Body(...)):
    """
    Score a device fingerprint for trust level using 100-Tree Random Forest model (0-25 Risk Budget).
    """
    result = device_engine.score(payload)
    return result


@app.post('/score/insider')
def score_insider(payload: Dict[str, Any] = Body(...)):
    """
    Evaluate an employee action against their behavioral baseline.
    """
    employee_id = payload.get('employee_id', '')
    action = payload.get('action', {})
    result = insider.score(employee_id, action)
    insider.record_action(employee_id, action)
    return result


@app.post('/score/text-risk')
def score_text_risk(payload: Dict[str, Any] = Body(...)):
    """
    Score receiver name and transfer note for semantic fraud patterns.
    """
    result = text_risk.score_receiver(
        payload.get('receiver_name', ''),
        payload.get('transfer_note', '')
    )
    return result


@app.post('/kyc/analyze')
def analyze_kyc(payload: Dict[str, Any] = Body(...)):
    """
    Cross-reference a new KYC application against all registered ones.
    """
    new_app = payload.get('application', {})
    existing = payload.get('existing_applications', [])

    if existing and not kyc_graph.app_registry:
        for ex_app in existing:
            kyc_graph.register_application(ex_app)

    result = kyc_graph.analyze(new_app)
    return result


@app.post('/kyc/register')
def register_kyc(payload: Dict[str, Any] = Body(...)):
    """
    Register an approved KYC application into the graph for future comparisons.
    """
    app_data = payload.get('application', {})
    if app_data:
        kyc_graph.register_application(app_data)
    return {'registered': True, 'app_id': str(app_data.get('_id', ''))}


@app.post('/score/unified')
def score_unified(payload: Dict[str, Any] = Body(...)):
    """
    Compute unified Dynamic Trust Score from all module scores.
    """
    module_scores = payload.get('module_scores', {})
    result = unified.compute_final_score(module_scores)
    return result


@app.post('/score/full')
def score_full(payload: Dict[str, Any] = Body(...)):
    """
    All-in-one endpoint: runs all applicable ML models and returns unified score.
    """
    module_scores = {}
    all_factors = []
    breakdown = {}

    try:
        cif = payload.get('cif', '')
        features = payload.get('features')
        if not features:
            session = payload.get('session', {})
            features = {
                "login_hour": session.get("login_hour", 12),
                "login_time_deviation": 0.0,
                "amount_ratio": session.get("amount_ratio", 1.0),
                "is_new_device": session.get("is_new_device", False),
                "is_new_ip": False,
                "is_new_location": session.get("is_new_location", False),
                "typing_variance": 30.0,
                "typing_deviation": 0.0,
                "navigation_depth": session.get("navigation_depth", 3),
                "navigation_deviation": 0.0,
                "actions_per_minute": session.get("actions_per_minute", 2.0),
                "idle_periods": 0,
                "copy_paste_detected": False
            }

        beh_result = behavioral.score(cif, features)
        module_scores['behavioral'] = beh_result['risk_score']
        all_factors.extend(beh_result.get('factors', []))
        breakdown['behavioral'] = beh_result
    except Exception as e:
        breakdown['behavioral'] = {'error': str(e)}

    try:
        device_signals = payload.get('device_signals', {})
        dev_result = device_engine.score(device_signals)
        module_scores['device'] = dev_result['risk_score']
        all_factors.extend(dev_result.get('factors', []))
        breakdown['device'] = dev_result
    except Exception as e:
        breakdown['device'] = {'error': str(e)}

    try:
        txt_result = text_risk.score_receiver(
            payload.get('receiver_name', ''),
            payload.get('transfer_note', '')
        )
        module_scores['text_risk'] = txt_result['risk_score']
        if txt_result.get('matched_pattern'):
            all_factors.append(
                f"Receiver name/note semantically matches fraud pattern: "
                f"'{txt_result['matched_pattern']}'"
            )
        breakdown['text_risk'] = txt_result
    except Exception as e:
        breakdown['text_risk'] = {'error': str(e)}

    unified_result = unified.compute_final_score(module_scores)

    return {
        'unified': unified_result,
        'all_factors': all_factors,
        'breakdown': breakdown,
    }


if __name__ == '__main__':
    print(f"Starting SACH Kavach FastAPI Engine on port {PORT}...")
    uvicorn.run(app, host='0.0.0.0', port=PORT)

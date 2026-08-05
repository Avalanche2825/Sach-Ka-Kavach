"""
Text-Based Receiver Risk Engine — SACH Kavach

Uses sentence-transformers to compute semantic similarity between
a transfer receiver name/note and known fraud pattern descriptions.

Model: paraphrase-MiniLM-L6-v2 (~90MB, downloads once, runs offline)
Falls back to keyword matching if sentence-transformers unavailable.
"""

import sys
import numpy as np

# Graceful import — fall back to keyword matching if torch or dependencies unavailable
TRANSFORMERS_AVAILABLE = False

if sys.version_info < (3, 13):
    try:
        from sentence_transformers import SentenceTransformer
        from sklearn.metrics.pairwise import cosine_similarity
        TRANSFORMERS_AVAILABLE = True
    except BaseException as e:
        print(f"Warning: SentenceTransformer import bypassed ({e}). Using keyword matcher.")
        TRANSFORMERS_AVAILABLE = False
else:
    print("Warning: Python 3.13+ detected. Disabling SentenceTransformer to prevent PyTorch compatibility freezes.")


# Known fraud narrative patterns in Indian banking context
FRAUD_PATTERNS = [
    "lottery prize claim transfer",
    "government subsidy refund advance",
    "customs clearance fee payment urgent",
    "KBC winner prize money",
    "insurance policy maturity amount",
    "advance fee for foreign remittance",
    "work from home investment scheme",
    "cryptocurrency investment profit",
    "RBI reserve bank penalty payment",
    "income tax refund processing fee",
    "TRAI telecom authority compliance",
    "ED enforcement directorate payment",
    "police case settlement money",
]

FRAUD_KEYWORDS = [
    'lottery', 'prize', 'subsidy', 'customs', 'clearance', 'kbc', 'winner',
    'insurance', 'maturity', 'advance', 'remittance', 'work from home',
    'crypto', 'rbi', 'penalty', 'income tax', 'refund', 'trai', 'enforcement',
    'directorate', 'police', 'settlement', 'urgent', 'claim', 'reward',
]


class TextRiskEngine:

    def __init__(self):
        self.model = None
        self.pattern_embeddings = None
        if TRANSFORMERS_AVAILABLE:
            try:
                self.model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
                self.pattern_embeddings = self.model.encode(
                    FRAUD_PATTERNS, normalize_embeddings=True
                )
                print("  Text Risk Engine: Sentence-Transformers model loaded")
            except Exception as e:
                print(f"  Text Risk Engine: Model load failed ({e}), using keyword fallback")
                self.model = None
        else:
            print("  Text Risk Engine: sentence-transformers not available, using keyword fallback")

    def _keyword_score(self, text: str) -> dict:
        """Keyword-based fallback scoring."""
        text_lower = text.lower()
        matched = [kw for kw in FRAUD_KEYWORDS if kw in text_lower]
        if len(matched) >= 3:
            risk_score = min(100, 30 + len(matched) * 10)
        elif len(matched) >= 1:
            risk_score = 20 + len(matched) * 8
        else:
            risk_score = 0

        return {
            'risk_score': risk_score,
            'matched_pattern': matched[0] if matched else None,
            'semantic_confidence': min(1.0, len(matched) * 0.2),
            'method': 'keyword_fallback',
        }

    def score_receiver(self, receiver_name: str, transfer_note: str = '') -> dict:
        text = f"{receiver_name} {transfer_note}".strip().lower()
        if not text:
            return {
                'risk_score': 0,
                'matched_pattern': None,
                'semantic_confidence': 0.0,
                'method': 'none',
            }

        if self.model is None or self.pattern_embeddings is None:
            return self._keyword_score(text)

        try:
            embedding = self.model.encode([text], normalize_embeddings=True)
            similarities = cosine_similarity(embedding, self.pattern_embeddings)[0]

            max_sim = float(np.max(similarities))
            best_idx = int(np.argmax(similarities))

            risk_score = 0
            matched_pattern = None

            if max_sim > 0.65:
                risk_score = int(max_sim * 100)
                matched_pattern = FRAUD_PATTERNS[best_idx]
            elif max_sim > 0.45:
                risk_score = int(max_sim * 70)
                matched_pattern = FRAUD_PATTERNS[best_idx]

            return {
                'risk_score': risk_score,
                'matched_pattern': matched_pattern,
                'semantic_confidence': round(max_sim, 3),
                'method': 'sentence_transformers',
            }
        except Exception as e:
            return self._keyword_score(text)

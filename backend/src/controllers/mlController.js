/**
 * ML Controller — SACH Kavach
 * Proxies scoring requests to the Python ML microservice.
 * Falls back gracefully if the ML service is unavailable.
 */

import http from 'http';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_HOST = ML_SERVICE_URL.replace('http://', '').split(':')[0];
const ML_PORT = parseInt(ML_SERVICE_URL.split(':').pop()) || 5001;

// ── Internal helper: POST to Python ML service ────────────────────────────────
function mlPost(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: ML_HOST,
        port: ML_PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('ML service parse error'));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('ML service timeout')));
    req.write(payload);
    req.end();
  });
}

// ── Heuristic fallback when ML service is down ────────────────────────────────
function heuristicRiskScore(amount, avgAmount, isNewDevice, isNewLocation) {
  let score = 10;
  const factors = [];
  const ratio = avgAmount > 0 ? amount / avgAmount : 1;

  if (ratio > 8) { score += 50; factors.push(`Transaction ${ratio.toFixed(1)}x above customer average — critical amount spike`); }
  else if (ratio > 5) { score += 35; factors.push(`Transaction ${ratio.toFixed(1)}x above customer average`); }
  else if (ratio > 2) { score += 15; factors.push(`Transaction ${ratio.toFixed(1)}x above customer average`); }

  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) { score += 20; factors.push(`Login at ${String(hour).padStart(2, '0')}:00 outside normal hours`); }
  if (isNewDevice) { score += 25; factors.push('Unrecognized device fingerprint detected'); }
  if (isNewLocation) { score += 20; factors.push('Geographic origin inconsistent with history'); }

  const finalScore = Math.min(100, score);
  let status = 'Approved';
  if (finalScore >= 75) status = 'Rejected';
  else if (finalScore >= 50) status = 'OTP_Required';
  else if (finalScore >= 35) status = 'CIF_Required';
  else status = 'Approved';

  return { risk_score: finalScore, factors, status, model_used: 'heuristic' };
}

// ── Full ML scoring pipeline ──────────────────────────────────────────────────
export async function scoreFull(payload) {
  try {
    const result = await mlPost('/score/full', payload);
    return { ...result, ml_available: true };
  } catch (err) {
    console.warn(`[ML] Service unavailable: ${err.message}. Using heuristic.`);
    const { amount = 0, avgAmount = 5000, isNewDevice = false, isNewLocation = false } = payload;
    const fallback = heuristicRiskScore(amount, avgAmount, isNewDevice, isNewLocation);
    return {
      unified: fallback,
      all_factors: fallback.factors,
      breakdown: { heuristic: fallback },
      ml_available: false,
    };
  }
}

// ── Individual endpoint handlers ──────────────────────────────────────────────
export async function scoreBehavioral(req, res) {
  try {
    const result = await mlPost('/score/behavioral', req.body);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'ML service unavailable', message: err.message });
  }
}

export async function scoreDevice(req, res) {
  try {
    const result = await mlPost('/score/device', req.body);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'ML service unavailable', message: err.message });
  }
}

export async function scoreInsider(req, res) {
  try {
    const result = await mlPost('/score/insider', req.body);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'ML service unavailable', message: err.message });
  }
}

export async function scoreTextRisk(req, res) {
  try {
    const result = await mlPost('/score/text-risk', req.body);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'ML service unavailable', message: err.message });
  }
}

export async function analyzeKYC(req, res) {
  try {
    const result = await mlPost('/kyc/analyze', req.body);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'ML service unavailable', message: err.message });
  }
}

export async function scoreUnified(req, res) {
  try {
    const result = await mlPost('/score/unified', req.body);
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: 'ML service unavailable', message: err.message });
  }
}

export async function mlHealth(req, res) {
  try {
    const result = await new Promise((resolve, reject) => {
      const req2 = http.request(
        { hostname: ML_HOST, port: ML_PORT, path: '/health', method: 'GET' },
        (r) => {
          let data = '';
          r.on('data', (c) => (data += c));
          r.on('end', () => resolve(JSON.parse(data)));
        }
      );
      req2.on('error', reject);
      req2.setTimeout(3000, () => req2.destroy(new Error('timeout')));
      req2.end();
    });
    res.json({ ml_service: 'online', ...result });
  } catch {
    res.status(503).json({ ml_service: 'offline', message: 'Python ML service not running on port 5001' });
  }
}

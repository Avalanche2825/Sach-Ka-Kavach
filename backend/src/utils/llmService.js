/**
 * LLM Risk Narrative Service — SACH Kavach
 *
 * Cascade:
 *   1. Grok API (xAI) — primary, model: grok-3-mini
 *   2. Groq API       — fallback, model: llama-3.3-70b-versatile
 *   3. Heuristic      — always works, perfectly aligned with Response Matrix
 */

import https from 'https';

const GROK_API_KEY = process.env.GROK_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

function postJSON(hostname, path, body, headers) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ error: 'parse_error', raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('LLM request timeout'));
    });
    req.write(payload);
    req.end();
  });
}

async function callGrok(prompt) {
  if (!GROK_API_KEY) throw new Error('No Grok API key');

  const body = {
    model: 'grok-3-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are SACH Kavach, an AI risk analyst for Bank of Baroda. ' +
          'Explain transaction or identity risk in 2-3 concise sentences using plain English. ' +
          'Align strictly with the Trust Score (80-100: ALLOW, 60-79: OTP_REQUIRED, 40-59: ALERT, 20-39: HOLD, 0-19: BLOCK). ' +
          'End with a clear recommendation matching the decision action.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 150,
    temperature: 0.3,
  };

  const result = await postJSON('api.x.ai', '/v1/chat/completions', body, {
    Authorization: `Bearer ${GROK_API_KEY}`,
  });

  const content = result?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Grok: empty response');
  return { narrative: content.trim(), source: 'grok' };
}

async function callGroq(prompt) {
  if (!GROQ_API_KEY) throw new Error('No Groq API key');

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are SACH Kavach, an AI risk analyst for Bank of Baroda. ' +
          'Explain transaction or identity risk in 2-3 concise sentences using plain English. ' +
          'Align strictly with the Trust Score (80-100: ALLOW, 60-79: OTP_REQUIRED, 40-59: ALERT, 20-39: HOLD, 0-19: BLOCK). ' +
          'End with a clear recommendation matching the decision action.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 150,
    temperature: 0.3,
  };

  const result = await postJSON('api.groq.com', '/openai/v1/chat/completions', body, {
    Authorization: `Bearer ${GROQ_API_KEY}`,
  });

  const content = result?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq: empty response');
  return { narrative: content.trim(), source: 'groq' };
}

// ── Heuristic Engine — perfectly aligned with Response Matrix ──────────────────
function heuristicNarrative(riskData) {
  const {
    riskScore = 20,
    trustScore: rawTrustScore,
    factors = [],
    receiverName = '',
    amount = 0,
    customerName = '',
  } = riskData;

  const trustScore = rawTrustScore !== undefined ? rawTrustScore : Math.max(0, 100 - riskScore);
  const amtFormatted = `₹${Number(amount).toLocaleString('en-IN')}`;
  const topFactor = factors[0] || 'session signal deviation observed';

  let narrative = '';
  let recommendation = '';

  if (trustScore >= 80) {
    narrative =
      `SACH Kavach evaluated transaction of ${amtFormatted} to ${receiverName || 'the beneficiary'} ` +
      `for ${customerName || 'customer'} with Trust Score ${trustScore}/100. All behavioral and device signals match baseline parameters.`;
    recommendation =
      `Recommendation: Allow transaction (Frictionless access).`;
  } else if (trustScore >= 60) {
    narrative =
      `Moderate signal deviation observed for ${customerName || 'customer'} attempting a ${amtFormatted} transfer ` +
      `to ${receiverName || 'beneficiary'}. Trust Score: ${trustScore}/100. Primary factor: ${topFactor}.`;
    recommendation =
      `Recommendation: Require OTP step-up authentication via SMS code before approving.`;
  } else if (trustScore >= 40) {
    narrative =
      `Security alert flagged for ${amtFormatted} transfer by ${customerName || 'customer'}. ` +
      `Trust Score: ${trustScore}/100. Contributing factor: ${topFactor}.`;
    recommendation =
      `Recommendation: Request customer account re-confirmation & dispatch alert.`;
  } else if (trustScore >= 20) {
    narrative =
      `Elevated risk index logged for ${amtFormatted} transfer by ${customerName || 'customer'} ` +
      `to ${receiverName || 'beneficiary'}. Trust Score: ${trustScore}/100. Primary factor: ${topFactor}.`;
    recommendation =
      `Recommendation: Hold transaction in escrow pending SOC Analyst review and approval.`;
  } else {
    narrative =
      `Critical security threat detected for ${amtFormatted} transfer by ${customerName || 'customer'}. ` +
      `Trust Score: ${trustScore}/100. Primary factor: ${topFactor}.`;
    recommendation =
      `Recommendation: Reject transaction immediately, freeze funds, and notify Fraud Operations.`;
  }

  return {
    narrative: `${narrative} ${recommendation}`.trim(),
    source: 'heuristic',
  };
}

export async function generateRiskNarrative(riskData) {
  const {
    riskScore = 20,
    trustScore: rawTrustScore,
    factors = [],
    receiverName = '',
    amount = 0,
    customerName = ''
  } = riskData;

  const trustScore = rawTrustScore !== undefined ? rawTrustScore : Math.max(0, 100 - riskScore);

  const prompt =
    `Customer: ${customerName}. ` +
    `Transaction amount: ₹${Number(amount).toLocaleString('en-IN')}. ` +
    `Receiver: ${receiverName}. ` +
    `Trust Score: ${trustScore}/100 (Risk Score: ${riskScore}/100). ` +
    `Risk signals: ${factors.slice(0, 3).join('; ') || 'none'}. ` +
    `Provide risk assessment and recommendation matching Trust Score bracket (80-100: ALLOW, 60-79: OTP_REQUIRED, 40-59: ALERT, 20-39: HOLD, 0-19: BLOCK).`;

  if (GROK_API_KEY) {
    try {
      return await callGrok(prompt);
    } catch (e) {
      console.warn(`[LLM] Grok failed: ${e.message}. Trying Groq...`);
    }
  }

  if (GROQ_API_KEY) {
    try {
      return await callGroq(prompt);
    } catch (e) {
      console.warn(`[LLM] Groq failed: ${e.message}. Using heuristic.`);
    }
  }

  return heuristicNarrative(riskData);
}

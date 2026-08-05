import * as dbBridge from '../utils/dbBridge.js';
import { GoogleGenAI, Type } from '@google/genai';

let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI. Using heuristic fallback.", err);
  }
}

export const getKYCApplications = async (req, res) => {
  try {
    const list = await dbBridge.getKYCApplications();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createKYCApplication = async (req, res) => {
  try {
    const { name, aadhaar, pan, deviceFingerprint, ipAddress } = req.body;
    if (!name || !aadhaar || !pan || !deviceFingerprint || !ipAddress) {
      return res.status(400).json({ error: 'All onboarding fields are required' });
    }

    const existingApps = await dbBridge.getKYCApplications();
    const suspiciousMatches = [];

    // Aadhaar duplicate check
    const cleanAadhaar = aadhaar.replace(/\s/g, '');
    const hasAadhaarMatch = existingApps.find(a => a.aadhaar.replace(/\s/g, '') === cleanAadhaar);
    if (hasAadhaarMatch) {
      suspiciousMatches.push(`Duplicate Aadhaar: already used by '${hasAadhaarMatch.name}' (App ID: ${hasAadhaarMatch._id})`);
    }

    // PAN duplicate check
    const cleanPAN = pan.trim().toUpperCase();
    const hasPANMatch = existingApps.find(a => a.pan.trim().toUpperCase() === cleanPAN);
    if (hasPANMatch) {
      suspiciousMatches.push(`Duplicate PAN: already registered by '${hasPANMatch.name}'`);
    }

    // Device reuse check
    const deviceReuseCount = existingApps.filter(a => a.deviceFingerprint === deviceFingerprint).length;
    if (deviceReuseCount > 0) {
      suspiciousMatches.push(`Device fingerprint shared across ${deviceReuseCount + 1} applications — fraud ring signal`);
    }

    // IP address check
    const ipReuseCount = existingApps.filter(a => a.ipAddress === ipAddress).length;
    if (ipReuseCount > 0) {
      suspiciousMatches.push(`IP address linked to ${ipReuseCount + 1} distinct applicants`);
    }

    // Velocity check
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    const velocityCount = existingApps.filter(a => new Date(a.timestamp).getTime() > thirtyMinutesAgo).length;
    if (velocityCount >= 2) {
      suspiciousMatches.push(`Velocity alert: ${velocityCount + 1} applications submitted within 30 minutes — bot/scripted pattern`);
    }

    const status = suspiciousMatches.length > 0 ? 'Flagged' : 'Approved';
    let riskScore = suspiciousMatches.length > 0 ? 80 + (suspiciousMatches.length * 5) : 10;

    // Enhance suspicious with Gemini fraud analysis
    if (ai && suspiciousMatches.length > 0) {
      try {
        const prompt = `
          Analyze this KYC application for identity spoofing or fraud rings.
          Name: ${name}
          Aadhaar: ${aadhaar} | PAN: ${pan}
          Device: ${deviceFingerprint} | IP: ${ipAddress}
          Matches: ${suspiciousMatches.join(', ')}
          Provide a 1-sentence fraud ring analysis summary.
        `;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                fraudRingAnalysis: { type: Type.STRING }
              },
              required: ['fraudRingAnalysis']
            }
          }
        });
        
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          suspiciousMatches.push(parsed.fraudRingAnalysis);
        }
      } catch (e) {
        console.warn("Gemini KYC analysis skipped.", e);
      }
    }

    const createdApp = await dbBridge.addKYCApplication({
      timestamp: new Date().toISOString(),
      name,
      aadhaar,
      pan,
      deviceFingerprint,
      ipAddress,
      status,
      suspiciousMatches
    });

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Automated KYC Agent',
      event: `KYC Application Processed: ${name}`,
      riskScore,
      riskFactors: suspiciousMatches,
      decision: status === 'Flagged' ? 'FLAGGED_MANUAL_REVIEW' : 'APPROVED_ONBOARDING'
    });

    res.status(201).json(createdApp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

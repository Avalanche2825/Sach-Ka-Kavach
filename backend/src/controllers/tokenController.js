import * as dbBridge from '../utils/dbBridge.js';

const employeeNamesMap = {
  'EMP100': 'Rahul Sharma',
  'EMP101': 'Sunil Mehta',
  'EMP102': 'Priya Das',
  'EMP103': 'Mohit Verma',
  'EMP104': 'Neha Gowda',
  'EMP105': 'Sanjay Singh'
};

export const getPrivilegeTokensList = async (req, res) => {
  try {
    const list = await dbBridge.getPrivilegeTokens();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createPrivilegeToken = async (req, res) => {
  try {
    const { employeeId, scope, durationMinutes } = req.body;
    if (!employeeId || !scope || !durationMinutes) {
      return res.status(400).json({ error: 'Missing required token properties' });
    }

    const employeeName = employeeNamesMap[employeeId] || `Officer ${employeeId}`;
    const token = {
      employeeId,
      employeeName,
      scope,
      durationMinutes: parseInt(durationMinutes) || 60
    };

    const savedToken = await dbBridge.addPrivilegeToken(token);

    // Write to audit log
    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Operations Security Center',
      event: `Temporary Privilege Token Issued to ${employeeId}: Scope: "${scope}" for ${durationMinutes} mins`,
      riskScore: 25,
      riskFactors: ['Short-term override token creation', 'Manual privilege assignment'],
      decision: 'LOGGED'
    });

    res.status(201).json(savedToken);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

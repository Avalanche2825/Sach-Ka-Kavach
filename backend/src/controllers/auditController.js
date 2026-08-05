import * as dbBridge from '../utils/dbBridge.js';

export const getAuditLogsList = async (req, res) => {
  try {
    const list = await dbBridge.getAuditLogs();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

import * as dbBridge from '../utils/dbBridge.js';

export const getTicketsList = async (req, res) => {
  try {
    const list = await dbBridge.getTickets();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTicketEntry = async (req, res) => {
  try {
    const { cif, customerName, query } = req.body;
    if (!cif || !customerName || !query) {
      return res.status(400).json({ error: "Missing required query ticket fields (cif, customerName, query)" });
    }

    // Generate a 6-digit simulated OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newTicket = await dbBridge.addTicket({
      cif,
      customerName,
      query,
      otp,
      otpVerified: false,
      status: 'PENDING_OTP'
    });

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Customer Support Portal',
      event: `Query Ticket Raised for CIF: ${cif} (Reason: ${query}). OTP Generated.`,
      riskScore: 10,
      riskFactors: ['Query ticket authorization requested'],
      decision: 'TICKET_CREATED'
    });

    res.status(201).json(newTicket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyTicketOTP = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const tickets = await dbBridge.getTickets();
    const ticket = tickets.find(t => t._id === id);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    const updated = await dbBridge.updateTicket(id, {
      otpVerified: true,
      status: 'AUTHORIZED'
    });

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Identity Verification Engine',
      event: `Query Ticket ${id} OTP Verified successfully. Staff access permitted for CIF: ${ticket.cif}.`,
      riskScore: 5,
      riskFactors: [],
      decision: 'TICKET_AUTHORIZED'
    });

    res.json({ success: true, message: "Ticket authorized successfully", ticket: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

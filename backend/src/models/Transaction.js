import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  _id: { type: String },
  timestamp: { type: String, required: true },
  cif: { type: String, required: true },
  customerName: { type: String, required: true },
  receiverName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  riskScore: { type: Number, required: true },
  riskFactors: [{ type: String }],
  explanation: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Rejected_Blocked', 'OTP_Required', 'CIF_Required', 'Escrow_Hold', 'Guardian_Required'],
    required: true 
  }
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

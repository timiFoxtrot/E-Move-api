import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    userId: { type: String, required: true },
    status: { type: String, default: "declined" },
    amount: { type: Number, required: true },
    transactionType: { type: String, required: true },
    processed: { type: Boolean, default: false },
    ref: { type: String },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('transaction', transactionSchema);
export default Transaction;

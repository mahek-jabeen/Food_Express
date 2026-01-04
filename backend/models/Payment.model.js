import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'credit_card', 'debit_card', 'cash', 'phonepe'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['initiated', 'pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  paidAt: Date,
  failureReason: String
}, {
  timestamps: true
});

paymentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.paymentId = `PAY${timestamp}${random}`;
  }
  next();
});

export default mongoose.model('Payment', paymentSchema);

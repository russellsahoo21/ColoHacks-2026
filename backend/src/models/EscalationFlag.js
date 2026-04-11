import mongoose from 'mongoose';

const escalationFlagSchema = new mongoose.Schema({
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['stale_discharge', 'long_cleaning', 'capacity_crunch', 'los_outlier'],
    required: true,
  },
  bedId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', default: null },
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  triggeredAt: { type: Date, default: Date.now },
  resolvedAt:  { type: Date, default: null },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  message:     { type: String, default: null },
}, { timestamps: true });

// Prevent duplicate open flags of the same type per bed/ward
escalationFlagSchema.index(
  { wardId: 1, type: 1, bedId: 1 },
  { unique: true, partialFilterExpression: { resolvedAt: null } }
);

escalationFlagSchema.index({ wardId: 1, resolvedAt: 1 });

export default mongoose.model('EscalationFlag', escalationFlagSchema);

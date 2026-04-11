import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true,
    index: true,
  },
  bedNumber:       { type: String, required: true, trim: true },
  status:          {
    type: String,
    enum: ['occupied', 'available', 'cleaning', 'reserved'],
    default: 'available',
    index: true,
  },
  patientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  assignedDoctor:  { type: String, default: null, trim: true },
  statusChangedAt: { type: Date, default: Date.now },
  expectedDischargeDate: { type: Date, default: null },
  notes:           { type: String, default: null },
}, { timestamps: true });

bedSchema.index({ wardId: 1, bedNumber: 1 }, { unique: true });
bedSchema.index({ wardId: 1, status: 1 });

export default mongoose.model('Bed', bedSchema);

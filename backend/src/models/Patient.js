import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name:                 { type: String, required: true, trim: true },
  age:                  { type: Number, min: 0, max: 150 },
  gender:               { type: String, enum: ['male', 'female', 'other'] },
  admissionDate:        { type: Date, required: true, default: Date.now },
  conditionCategory:    { type: String, required: true, trim: true },
  responsibleDoctor:    { type: String, trim: true },
  expectedDischarge:    { type: Date, default: null },
  dischargeCompletedAt: { type: Date, default: null },
  losThresholdDays:     { type: Number, default: null },
  notes:                { type: String, default: null },
}, { timestamps: true });

patientSchema.index({ expectedDischarge: 1, dischargeCompletedAt: 1 });

// Virtual: current length of stay in days
patientSchema.virtual('losDays').get(function () {
  const end = this.dischargeCompletedAt ?? new Date();
  return Math.floor((end - this.admissionDate) / 86_400_000);
});

export default mongoose.model('Patient', patientSchema);

import mongoose from 'mongoose';

const eventLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['bed', 'patient', 'admission', 'escalation', 'ward'],
    required: true,
  },
  entityId:  { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  action:    { type: String, required: true },
  actorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wardId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', index: true },
  payload:   { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Intentionally no updatedAt — event log is append-only
eventLogSchema.set('timestamps', false);
eventLogSchema.index({ wardId: 1, createdAt: -1 });

export default mongoose.model('EventLog', eventLogSchema);

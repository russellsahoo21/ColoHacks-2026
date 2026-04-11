import mongoose from 'mongoose';

const wardForecastSchema = new mongoose.Schema({
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true,
    unique: true,
  },
  now:  {
    occupied: { type: Number, default: 0 },
    total:    { type: Number, default: 0 },
  },
  at4h: {
    occupied: { type: Number, default: 0 },
    total:    { type: Number, default: 0 },
  },
  at8h: {
    occupied: { type: Number, default: 0 },
    total:    { type: Number, default: 0 },
  },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('WardForecast', wardForecastSchema);

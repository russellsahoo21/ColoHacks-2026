// src/models/Ward.js
import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  floor:     { type: String, trim: true },
  totalBeds: { type: Number, required: true, min: 1 },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Ward', wardSchema);

import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
      index: true,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      default: null,
    },
    type: { type: String, enum: ["emergency", "elective"], required: true },
    expectedArrival: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "arrived", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: { type: String, default: null },
  },
  { timestamps: true },
);

admissionSchema.index({ wardId: 1, status: 1 });
admissionSchema.index({ wardId: 1, expectedArrival: 1, status: 1 });

export default mongoose.model("Admission", admissionSchema);

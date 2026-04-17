import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

// ─── Auth ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(1),
  role:     z.enum(['ward_staff', 'ward_doctor', 'admin']),
  otp:      z.string().length(6),
});

// ─── Bed ─────────────────────────────────────────────────────────────────────
export const bedStatusSchema = z.object({
  status:    z.enum(['occupied', 'available', 'cleaning', 'reserved']),
  patientId: objectId.nullable().optional(),
  assignedDoctor: z.string().trim().optional().nullable(),
  notes:     z.string().trim().optional().nullable(),
  expectedDischargeDate: z.coerce.date().nullable().optional(),
});

export const createBedSchema = z.object({
  wardId:    objectId,
  bedNumber: z.string().trim().min(1),
  status:    z.enum(['occupied', 'available', 'cleaning', 'reserved']).default('available'),
});

// ─── Patient ─────────────────────────────────────────────────────────────────
export const createPatientSchema = z.object({
  name:              z.string().trim().min(1),
  age:               z.number().int().min(0).max(150).optional(),
  gender:            z.enum(['male', 'female', 'other']).optional(),
  conditionCategory: z.string().trim().min(1),
  responsibleDoctor: z.string().trim().optional(),
  admissionDate:     z.coerce.date().optional(),
  expectedDischarge: z.coerce.date().optional().nullable(),
  losThresholdDays:  z.number().int().min(1).optional().nullable(),
  notes:             z.string().trim().optional().nullable(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const dischargeSchema = z.object({
  dischargeCompletedAt: z.coerce.date().optional(),
});

// ─── Admission ───────────────────────────────────────────────────────────────
export const createAdmissionSchema = z.object({
  patientId:       objectId,
  wardId:          objectId,
  type:            z.enum(['emergency', 'elective']),
  expectedArrival: z.coerce.date().optional().nullable(),
  notes:           z.string().trim().optional().nullable(),
});

export const arriveAdmissionSchema = z.object({
  bedId: objectId,
});

// ─── Ward ────────────────────────────────────────────────────────────────────
export const createWardSchema = z.object({
  name:      z.string().trim().min(1),
  floor:     z.string().trim().optional(),
  totalBeds: z.number().int().min(1),
});

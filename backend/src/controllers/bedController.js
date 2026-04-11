import * as bedService from '../services/bedService.js';
import Ward from '../models/Ward.js';
import Bed from '../models/Bed.js';
import { assertSameWard, assertDocInWard } from '../utils/accessControl.js';

export const backfillBeds = async (req, res) => {
  try {
    const wards = await Ward.find();
    let wardsFixed = 0;

    for (const ward of wards) {
      // Check if this ward actually has beds
      const count = await Bed.countDocuments({ wardId: ward._id });
      
      if (count === 0) {
        const bedPromises = [];
        // Create as many beds as the ward capacity says
        for (let i = 1; i <= ward.totalBeds; i++) {
          bedPromises.push(
            Bed.create({
              wardId: ward._id,
              bedNumber: `${ward.name.substring(0, 2).toUpperCase()}-${i.toString().padStart(2, '0')}`,
              status: 'available'
            })
          );
        }
        await Promise.all(bedPromises);
        wardsFixed++;
      }
    }
    res.status(200).json({ message: `Successfully provisioned beds for ${wardsFixed} empty wards.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getWardBeds = async (req, res, next) => {
  try {
    assertSameWard(req, req.params.wardId);
    const beds = await bedService.getWardBeds(req.params.wardId);

    if (beds.length === 0) {
      if (req.params.wardId === 'global') return res.json(beds);
      const ward = await Ward.findById(req.params.wardId).lean();
      if (ward && ward.totalBeds > 0) {
        const bedDocs = Array.from({ length: ward.totalBeds }, (_, index) => ({
          wardId: ward._id,
          bedNumber: `${ward.name.substring(0, 3).toUpperCase()}-${(index + 1).toString().padStart(2, '0')}`,
          status: 'available'
        }));
        await Bed.insertMany(bedDocs).catch(() => {});
        const refreshedBeds = await bedService.getWardBeds(req.params.wardId);
        return res.json(refreshedBeds);
      }
    }

    res.json(beds);
  } catch (err) { next(err); }
};

export const getSingleBed = async (req, res, next) => {
  try {
    const bed = await bedService.getBedById(req.params.bedId);
    if (!bed) return res.status(404).json({ error: 'Bed not found' });
    assertDocInWard(req, bed.wardId);
    res.json(bed);
  } catch (err) { next(err); }
};

export const createBed = async (req, res, next) => {
  try {
    const bed = await bedService.createBed(req.body);
    res.status(201).json(bed);
  } catch (err) { next(err); }
};

export const updateBedStatus = async (req, res, next) => {
  try {
    const { status, patientId, assignedDoctor, notes, expectedDischargeDate } = req.body;

    // Validate the transition before touching the DB
    const currentBed = await bedService.validateTransition(req.params.bedId, status);
    assertDocInWard(req, currentBed.wardId);

    // Write to MongoDB — Change Stream broadcasts to WS clients automatically
    const bed = await bedService.updateStatus(req.params.bedId, status, patientId, assignedDoctor, notes, expectedDischargeDate);

    // Append audit event (fire-and-forget)
    bedService.logEvent(
      'bed', bed._id, 'status_update',
      req.user._id, bed.wardId,
      { from: currentBed.status, to: status }
    ).catch(() => {});

    res.json(bed);
  } catch (err) { next(err); }
};

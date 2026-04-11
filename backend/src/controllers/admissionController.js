import Admission from '../models/Admission.js';
import * as queueService from '../services/queueService.js';
import * as bedService from '../services/bedService.js';
import { assertSameWard, assertDocInWard } from '../utils/accessControl.js';

export const getQueue = async (req, res, next) => {
  try {
    assertSameWard(req, req.params.wardId);
    const [pendingAdmissions, pendingDischarges] = await Promise.all([
      queueService.getPendingAdmissions(req.params.wardId),
      queueService.getPendingDischarges(req.params.wardId),
    ]);
    res.json({ pendingAdmissions, pendingDischarges });
  } catch (err) { next(err); }
};

export const createAdmission = async (req, res, next) => {
  try {
    let wardId = req.body.wardId;
    // Global pool architecture
    if (!wardId) return res.status(400).json({ error: 'Ward ID is required' });

    const admission = await Admission.create({ ...req.body, wardId });
    res.status(201).json(admission);
  } catch (err) { next(err); }
};

export const arriveAdmission = async (req, res, next) => {
  try {
    const { bedId } = req.body;

    const admission = await Admission.findById(req.params.id).lean();
    if (!admission) return res.status(404).json({ error: 'Admission not found' });
    assertDocInWard(req, admission.wardId);

    // Ensure the target bed is available
    const bed = await bedService.getBedById(bedId);
    if (!bed) return res.status(404).json({ error: 'Bed not found' });
    if (bed.status !== 'available' && bed.status !== 'reserved') {
      return res.status(422).json({ error: `Bed is currently '${bed.status}', not assignable` });
    }
    if (bed.wardId.toString() !== admission.wardId.toString()) {
      return res.status(403).json({ error: 'Bed does not belong to the admission ward' });
    }

    // markArrived updates both the admission and the bed in one go
    // Change Stream will fire for the Bed update → WS broadcast
    const arrived = await queueService.markArrived(req.params.id, bedId);

    bedService.logEvent(
      'admission', arrived._id, 'patient_arrived',
      req.user._id, arrived.wardId,
      { bedId }
    ).catch(() => {});

    res.json(arrived);
  } catch (err) { next(err); }
};

export const cancelAdmission = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id).lean();
    if (!admission) return res.status(404).json({ error: 'Admission not found' });
    assertDocInWard(req, admission.wardId);

    const cancelled = await queueService.cancelAdmission(req.params.id);
    res.json(cancelled);
  } catch (err) { next(err); }
};

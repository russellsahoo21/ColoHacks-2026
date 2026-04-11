import * as flagService from '../services/flagService.js';
import * as bedService from '../services/bedService.js';
import EscalationFlag from '../models/EscalationFlag.js';
import { assertSameWard, assertDocInWard } from '../utils/accessControl.js';

export const getOpenFlags = async (req, res, next) => {
  try {
    assertSameWard(req, req.params.wardId);
    const includeResolved = req.query.resolved === 'true';
    const flags = await flagService.getAllFlags(req.params.wardId, includeResolved);
    res.json(flags);
  } catch (err) { next(err); }
};

export const raiseFlag = async (req, res, next) => {
  try {
    const wardId = req.params.wardId;
    assertSameWard(req, wardId);

    const { type, bedId, patientId, message } = req.body;
    const { flag, isNew } = await flagService.createFlag({ wardId, type, bedId, patientId, message });

    if (!flag) {
      return res.status(409).json({ error: 'Escalation flag already exists for this type and target' });
    }

    bedService.logEvent(
      'escalation', flag._id, 'flag_created',
      req.user._id, wardId,
      { type: flag.type, bedId: flag.bedId, patientId: flag.patientId, message: flag.message }
    ).catch(() => {});

    res.status(isNew ? 201 : 200).json(flag);
  } catch (err) { next(err); }
};

export const resolveFlag = async (req, res, next) => {
  try {
    const flag = await EscalationFlag.findById(req.params.flagId).lean();
    if (!flag) return res.status(404).json({ error: 'Flag not found' });
    assertDocInWard(req, flag.wardId);

    const resolved = await flagService.resolveFlag(req.params.flagId, req.user._id);

    bedService.logEvent(
      'escalation', resolved._id, 'flag_resolved',
      req.user._id, resolved.wardId,
      { type: resolved.type }
    ).catch(() => {});

    res.json(resolved);
  } catch (err) { next(err); }
};

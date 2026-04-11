import Bed from '../models/Bed.js';
import EscalationFlag from '../models/EscalationFlag.js';
import Admission from '../models/Admission.js';
import { wsHub } from '../services/wsHub.js';
const logger = console;

const RETRY_DELAY_MS = 5_000;

const watchCollection = (model, pipeline, eventType, getWardId, options = {}) => {
  const start = () => {
    const stream = model.watch(pipeline, {
      fullDocument: 'updateLookup',
      ...options,
    });

    stream.on('change', (change) => {
      const doc = change.fullDocument;
      if (!doc) return;

      const wardId = getWardId(doc);
      if (!wardId) return;

      wsHub.broadcast(wardId.toString(), {
        type: eventType,
        data: doc,
        operationType: change.operationType,
        timestamp: new Date().toISOString(),
      });
    });

    stream.on('error', (err) => {
      logger.error(`Change stream error on ${model.modelName}`, { err: err.message });
      stream.close();
      // Reconnect after delay — handles transient network issues
      setTimeout(start, RETRY_DELAY_MS);
    });

    stream.on('close', () => {
      logger.warn(`Change stream closed on ${model.modelName}, reconnecting...`);
      setTimeout(start, RETRY_DELAY_MS);
    });

    logger.info(`Change stream watching: ${model.modelName}`);
    return stream;
  };

  return start();
};

export const startChangeStreams = () => {
  // ── Beds: any insert/update fires BED_UPDATED to the ward
  watchCollection(
    Bed,
    [{ $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }],
    'BED_UPDATED',
    (doc) => doc.wardId
  );

  // ── Escalation flags: new flag fires FLAG_RAISED; resolved flag fires FLAG_RESOLVED
  watchCollection(
    EscalationFlag,
    [{ $match: { operationType: { $in: ['insert', 'update'] } } }],
    'FLAG_EVENT',
    (doc) => doc.wardId,
  );

  // ── Admissions: status change (arrived/cancelled) fires ADMISSION_UPDATED
  watchCollection(
    Admission,
    [{ $match: { operationType: { $in: ['insert', 'update'] } } }],
    'ADMISSION_UPDATED',
    (doc) => doc.wardId
  );
};

const logger = console;

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  // Known app errors carry a .status property
  const status = err.status ?? 500;

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry', detail: err.keyValue });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(422).json({ error: 'Invalid data', detail: err.message });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
};

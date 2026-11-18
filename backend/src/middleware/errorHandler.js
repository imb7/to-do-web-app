/**
 * Centralized Error Handling Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('[Error]', {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle MySQL duplicate entry error (e.g. unique constraint on username)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this identifier already exists.'
    });
  }

  // Handle MySQL connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable. Please try again shortly.'
    });
  }

  // Handle invalid JSON payload
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload in request body.'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational || process.env.NODE_ENV !== 'production'
    ? err.message
    : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message
  });
}

// 404 Route Not Found Middleware
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};

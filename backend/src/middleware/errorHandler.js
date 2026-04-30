function notFoundHandler(req, _res, next) {
  next({
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(error, _req, res, _next) {
  const statusCode = Number(error?.statusCode || error?.status || 500);
  const message = error?.message || "Internal server error";

  if (statusCode >= 500) {
    console.error("API ERROR:", error);
  }

  res.status(statusCode).json({
    error: message,
    ...(error?.details ? { details: error.details } : {}),
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};

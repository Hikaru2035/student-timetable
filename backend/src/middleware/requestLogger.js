export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms userId=${req.userId || 'anonymous'}`
    );
  });

  next();
};
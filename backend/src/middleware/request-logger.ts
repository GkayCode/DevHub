import type { RequestHandler } from "express";

const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;

    console.log(
      `[${new Date().toISOString()}] ` +
        `${req.method} ${req.originalUrl} ` +
        `${res.statusCode} ${duration}ms`
    );
  });

  next();
};

export default requestLogger;
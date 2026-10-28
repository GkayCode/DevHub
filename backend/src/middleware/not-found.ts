import type { RequestHandler } from "express";

const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: "İstenen endpoint bulunamadı.",
    path: req.originalUrl,
  });
};

export default notFound;
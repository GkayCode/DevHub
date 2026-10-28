import { Router } from "express";
import { renderReadme } from "../controllers/readme-builder.controller";

const router = Router();

router.post("/:id/render", renderReadme);

export default router;
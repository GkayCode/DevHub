import { Router } from "express";
import { getRepositoryStats } from "../controllers/github-stats.controller";

const router = Router();

router.get("/:username", getRepositoryStats);

export default router;
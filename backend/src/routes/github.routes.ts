
import { Router } from "express";
import {
  getProfile,
  getRepositories,
  searchRepositories,
} from "../controllers/github.controller";

const router = Router();

router.get("/search/repos", searchRepositories);
router.get("/:username/repos", getRepositories);
router.get("/:username", getProfile);

export default router;

import { Router } from "express";

import {
  listDrafts,
  getDraft,
  createDraft,
  updateDraft,
  deleteDraft,
} from "../controllers/readme-drafts.controller";

const router = Router();

router.get("/", listDrafts);
router.post("/", createDraft);
router.get("/:id", getDraft);
router.patch("/:id", updateDraft);
router.delete("/:id", deleteDraft);

export default router;
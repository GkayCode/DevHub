import { Router } from "express";
import {
  getReadmeTemplate,
  getReadmeTemplates,
} from "../controllers/readme-templates.controller";

const router = Router();

router.get("/", getReadmeTemplates);
router.get("/:id", getReadmeTemplate);

export default router;

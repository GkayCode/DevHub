import { Router } from "express";
import { getRepositoryReadme, listMyRepositories, updateRepositoryReadme } from "../controllers/managed-github.controller";
import { requireGitHubSession } from "../middleware/require-github-session";

const router = Router();
router.use(requireGitHubSession);
router.get("/repos", listMyRepositories);
router.get("/repos/:owner/:repo/readme", getRepositoryReadme);
router.put("/repos/:owner/:repo/readme", updateRepositoryReadme);
export default router;

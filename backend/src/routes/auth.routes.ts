import { Router } from "express";
import { currentUser, githubCallback, logoutUser, startGitHubAuth } from "../controllers/auth.controller";

const router = Router();
router.get("/github", startGitHubAuth);
router.get("/github/callback", githubCallback);
router.get("/me", currentUser);
router.post("/logout", logoutUser);
export default router;

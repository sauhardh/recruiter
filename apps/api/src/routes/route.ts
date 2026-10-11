import { Router } from "express";
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  getCurrentUser,
  logoutUser,
} from "./auth.js";
import { requireAuth } from "../middlewares/auth.js";

const router: Router = Router();

router.get("/auth/google", initiateGoogleAuth);
router.get("/auth/google/callback", handleGoogleCallback);
router.get("/auth/me", requireAuth, getCurrentUser);
router.post("/auth/logout", logoutUser);

export default router;

import { Router } from "express";
import { authController } from "../services/auth/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { getPositions, getPostion } from "../services/positions/getPosition.js";
import {
  storePositions,
  updatePosition,
} from "../services/positions/storePosition.js";
import { announcePosition } from "../services/positions/announcePosition.js";
import {
  getApplicationForm,
  submitApplication,
} from "../services/apply/applicationForm.js";
import {
  getCandidates,
  getCandidate,
} from "../services/candidates/getCandidate.js";
import { getTrackingApplication } from "../services/tracking/getTracking.js";
import { submitAssessment } from "../services/tracking/submitAssessment.js";
import { evaluateCandidate } from "../services/positions/evaluateCandidate.js";
import { scheduleCandidateRound } from "../services/positions/scheduleCandidateRound.js";
import { updateRound } from "../services/positions/updateRound.js";
import { upload } from "../lib/utils.js";

const router: Router = Router();

// Checks to maintain the session, based on cookies
router.get("/auth/me", requireAuth, authController.getCurrentUser);
router.get("/auth/google", authController.initiateGoogleAuth);
router.get("/auth/google/callback", authController.handleGoogleCallback);
router.post("/auth/logout", authController.logoutUser);

router.get("/positions", requireAuth, getPositions);
router.post("/positions", requireAuth, storePositions);
router.get("/positions/:id", requireAuth, getPostion);
router.patch("/positions/:id", requireAuth, updatePosition);
router.post("/positions/:id/announce", requireAuth, announcePosition);
router.patch(
  "/positions/:positionId/rounds/:roundId",
  requireAuth,
  updateRound,
);

// Candidate evaluation per round
router.post(
  "/applications/:applicationId/evaluate",
  requireAuth,
  evaluateCandidate,
);
router.patch(
  "/applications/:applicationId/rounds/:roundId/schedule",
  requireAuth,
  scheduleCandidateRound,
);

router.get("/apply/:positionId", getApplicationForm);
router.post("/apply/:positionId", upload.single("resume"), submitApplication);

// Candidate tracking portal
router.get("/track/:token", getTrackingApplication);
router.post("/track/:token/rounds/:roundId/submit", submitAssessment);

router.get("/candidates", requireAuth, getCandidates);
router.get("/candidates/:id", requireAuth, getCandidate);

export default router;

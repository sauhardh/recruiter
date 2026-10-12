import { Router } from "express";
import multer from "multer";
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  getCurrentUser,
  logoutUser,
} from "./auth.js";
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
import { evaluateCandidate } from "../services/positions/evaluateCandidate.js";
import { updateRound } from "../services/positions/updateRound.js";

const router: Router = Router();

// memory storage for resume uploads (written to disk in the handler)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = file.originalname
      .toLowerCase()
      .slice(file.originalname.lastIndexOf("."));
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are accepted"));
    }
  },
});

router.get("/auth/google", initiateGoogleAuth);
router.get("/auth/google/callback", handleGoogleCallback);
router.get("/auth/me", requireAuth, getCurrentUser);
router.post("/auth/logout", logoutUser);

router.get("/positions", requireAuth, getPositions);
router.post("/positions", requireAuth, storePositions);
router.get("/positions/:id", requireAuth, getPostion);
router.patch("/positions/:id", requireAuth, updatePosition);
router.post("/positions/:id/announce", requireAuth, announcePosition);
router.patch("/positions/:positionId/rounds/:roundId", requireAuth, updateRound);

// Candidate evaluation per round
router.post("/applications/:applicationId/evaluate", requireAuth, evaluateCandidate);

router.get("/apply/:positionId", getApplicationForm);
router.post("/apply/:positionId", upload.single("resume"), submitApplication);

// Candidate tracking portal
router.get("/track/:token", getTrackingApplication);

router.get("/candidates", requireAuth, getCandidates);
router.get("/candidates/:id", requireAuth, getCandidate);

export default router;

import express, { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  getJobManager,
  getJobManagerById,
  getJobManagerJobListing,
  getJobManagerProfile,
  register,
  signIn,
  updateJobManagerProfile,
} from "../controllers/jobmanagerController.js";
import userAuth from "../middlewares/authMiddleware.js";

const router = express.Router();

//ip rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// REGISTER
router.post("/register", limiter, register);

// LOGIN
router.post("/login", limiter, signIn);

// GET DATA
router.post("/get-jobmanager-profile", userAuth, getJobManagerProfile);
router.post("/get-jobmanager-joblisting", userAuth, getJobManagerJobListing);
router.get("/", getJobManager);
router.get("/get-jobmanager/:id", getJobManagerById);

// UPDATE DATA
router.put("/update-jobmanager", userAuth, updateJobManagerProfile);

export default router;

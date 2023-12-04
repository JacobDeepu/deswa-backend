import express from "express";

import authRoute from "./authRoutes.js";
import userRoute from "./userRoutes.js";
import jobmanagerRoute from "./jobmanagerRoutes.js";
import jobRoute from "./jobsRoutes.js";

const router = express.Router();

const path = "/api-v1/";

router.use(`${path}auth`, authRoute); //api-v1/auth/
router.use(`${path}users`, userRoute);
router.use(`${path}jobmanager`, jobmanagerRoute);
router.use(`${path}jobs`, jobRoute);

export default router;

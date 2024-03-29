import express from "express";
import {
    editCongregation,
    getAllCongregationActivities,
    getCongregationInfo,
    resendTwoFactorCode,
    verifyTwoFactor,
} from "../controllers/congregation.js";
import { isLoggedIn } from "../helpers.js";

const router = express.Router({ mergeParams: true });

router.get("/", isLoggedIn, getCongregationInfo);
router.get("/:congregation_id/activities", isLoggedIn, getAllCongregationActivities);

router.post("/:congregation_id/two-factor", verifyTwoFactor);
router.post("/:congregation_id/resend/two-factor", resendTwoFactorCode);

router.put("/:congregation_id", isLoggedIn, editCongregation);

export default router;

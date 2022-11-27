import express from "express";
import {
    editCongregation,
    registerCongregation,
    renderCongregationInfo,
    renderEditCongregationForm,
    renderRegisterCongregationForm,
    renderTwoFactorForm,
    renderVerificationForm,
    resendTwoFactorCode,
    resendVerificationCode,
    verifyCongregation,
    verifyTwoFactor,
} from "../controllers/congregation.js";
import { isLoggedIn } from "../helpers.js";

const router = express.Router({ mergeParams: true });

router.get("/new", renderRegisterCongregationForm);
router.get("/:congregation_id", isLoggedIn, renderCongregationInfo);
router.get("/:congregation_id/edit", isLoggedIn, renderEditCongregationForm);
router.get("/:congregation_id/verification", renderVerificationForm);
router.get("/:congregation_id/two-factor", renderTwoFactorForm);

router.post("/", registerCongregation);
router.post("/:congregation_id/resend/verification", resendVerificationCode);
router.post("/:congregation_id/verification", verifyCongregation);
router.post("/:congregation_id/two-factor", verifyTwoFactor);
router.post("/:congregation_id/resend/two-factor", resendTwoFactorCode);

router.put("/:congregation_id", isLoggedIn, editCongregation);

export default router;

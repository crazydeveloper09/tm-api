import express from "express";
import { authenticateCongregation, logOutCongregation, askAccess, sendSupportEmail, registerDevice, shareIdea, raiseIssue, helpInTranslation, renderPrivacyPolicy, renderSupportForm, renderForgotForm, renderResetSuccessPage, renderResetForm, sendPasswordResetEmail, resetPassword, editCongregationEmailHash } from "../controllers/index.js";

const router = express.Router({mergeParams: true});


router.get("/logout", logOutCongregation);
router.get("/policy", renderPrivacyPolicy);
router.get("/support", renderSupportForm);
router.get("/forgot", renderForgotForm);
router.get("/reset/success", renderResetSuccessPage);
router.get("/reset/:token", renderResetForm);
router.get("/update-congs", editCongregationEmailHash)

router.post("/support", sendSupportEmail)
router.post("/login", authenticateCongregation);
router.post("/ask-access", askAccess);
router.post("/share-idea", shareIdea);
router.post("/translate", helpInTranslation);
router.post("/raise-issue", raiseIssue);
router.post("/register-device", registerDevice)
router.post("/forgot", sendPasswordResetEmail);
router.post("/reset/:token", resetPassword)



export default router;
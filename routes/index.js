import express from "express";
import { authenticateCongregation, logOutCongregation, askAccess, sendSupportEmail, registerDevice, encryptAllData, shareIdea, raiseIssue, helpInTranslation, renderPrivacyPolicy, renderSupportForm } from "../controllers/index.js";

const router = express.Router({mergeParams: true});


router.get("/logout", logOutCongregation);
router.get("/policy", renderPrivacyPolicy);
router.get("/support", renderSupportForm)

router.post("/support", sendSupportEmail)
router.post("/login", authenticateCongregation);
router.post("/encrypt-data", encryptAllData)
router.post("/ask-access", askAccess);
router.post("/share-idea", shareIdea);
router.post("/translate", helpInTranslation);
router.post("/raise-issue", raiseIssue);
router.post("/register-device", registerDevice)



export default router;
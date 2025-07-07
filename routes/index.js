import express from "express";
import { authenticateCongregation, logOutCongregation, askAccess, registerDevice, encryptAllData, shareIdea, raiseIssue, helpInTranslation } from "../controllers/index.js";

const router = express.Router({mergeParams: true});


router.get("/logout", logOutCongregation);

router.post("/login", authenticateCongregation);
router.post("/encrypt-data", encryptAllData)
router.post("/ask-access", askAccess);
router.post("/share-idea", shareIdea);
router.post("/translate", helpInTranslation);
router.post("/raise-issue", raiseIssue);

router.post("/register-device", registerDevice)



export default router;
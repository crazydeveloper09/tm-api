import express from "express";
import { authenticateCongregation, encryptAllData, logOutCongregation, registerDevice } from "../controllers/index.js";

const router = express.Router({mergeParams: true});


router.get("/logout", logOutCongregation);

router.post("/encrypt-data", encryptAllData)

router.post("/login", authenticateCongregation);

router.post("/register-device", registerDevice)



export default router;
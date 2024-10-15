import express from "express";
import { authenticateCongregation, logOutCongregation, registerDevice } from "../controllers/index.js";

const router = express.Router({mergeParams: true});


router.get("/logout", logOutCongregation);

router.post("/login", authenticateCongregation);

router.post("/register-device", registerDevice)



export default router;
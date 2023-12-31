import express from "express";
import { authenticateCongregation, logOutCongregation } from "../controllers/index.js";

const router = express.Router({mergeParams: true});


router.get("/logout", logOutCongregation);

router.post("/login", authenticateCongregation);




export default router;
import express from "express";
import { isLoggedIn } from "../helpers.js";
import {
    createPreacher,
    deletePreacher,
    editPreacher,
    encryptData,
    generateLinkForPreacher,
    getAllPreachers,
    getListOfPreachers,
    getPreacherInfo,
    preacherLogIn,
    searchPreachers,
} from "../controllers/preacher.js";

const router = express.Router({ mergeParams: true });

router.get("/", isLoggedIn, getListOfPreachers);
router.get("/all", isLoggedIn, getAllPreachers);
router.get("/search", isLoggedIn, searchPreachers);
router.get("/:preacher_id", isLoggedIn, getPreacherInfo);

router.post("/", isLoggedIn, createPreacher);
router.post("/login", preacherLogIn);
router.post("/encrypt-data", encryptData)
router.post("/:preacher_id/generateLink", isLoggedIn, generateLinkForPreacher);

router.put("/:preacher_id", isLoggedIn, editPreacher);

router.delete('/:preacher_id', isLoggedIn, deletePreacher)

export default router;

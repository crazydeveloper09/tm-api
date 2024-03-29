import express from "express";
import { isLoggedIn } from "../helpers.js";
import {
    createMinistryGroup,
    deleteMinistryGroup,
    editMinistryGroup,
    generateListOfMinistryGroups,
    getListOfMinistryGroups,
} from "../controllers/ministryGroup.js";

const router = express.Router({ mergeParams: true });

router.get("/generate-pdf", isLoggedIn, generateListOfMinistryGroups);
router.get("/", isLoggedIn, getListOfMinistryGroups);

router.post("/", isLoggedIn, createMinistryGroup);

router.put("/:ministryGroup_id", isLoggedIn, editMinistryGroup);

router.delete('/:ministryGroup_id', isLoggedIn, deleteMinistryGroup)

export default router;

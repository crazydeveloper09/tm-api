import express from "express";
import { isLoggedIn } from "../helpers.js";
import {
    createMeeting,
    deleteMeeting,
    editMeeting,
    getListOfMeetingAssignmentsOfPreacher,
    getListOfMeetings,
} from "../controllers/meeting.js";
import { loadAudioVideoAssignmentsOfPreacher } from "../controllers/audioVideo.js";

const router = express.Router({ mergeParams: true });

router.get("/", isLoggedIn, getListOfMeetings);
router.get("/preacher/assignments", isLoggedIn, getListOfMeetingAssignmentsOfPreacher);
router.get("/preacher/audioVideo/assignments", isLoggedIn, loadAudioVideoAssignmentsOfPreacher);

router.post("/", isLoggedIn, createMeeting);

router.put("/:meeting_id", isLoggedIn, editMeeting);

router.delete('/:meeting_id', isLoggedIn, deleteMeeting)

export default router;

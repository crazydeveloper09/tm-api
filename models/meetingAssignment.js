import mongoose from "mongoose";
import { decrypt, encrypt } from "../helpers.js";

const meetingAssignmentSchema = new mongoose.Schema({
    topic: String,
    participant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
    otherParticipant: {
        type: String,
        set: (otherParticipant) => encrypt(otherParticipant),
        get: (encryptedOtherParticipant) => decrypt(encryptedOtherParticipant),
    },
    reader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
    helper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
    type: String,
    defaultTopic: String,
    meeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting"
    }
})

meetingAssignmentSchema.set("toJSON", { getters: true })

export default mongoose.model("MeetingAssignment", meetingAssignmentSchema)
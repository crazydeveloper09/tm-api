import mongoose from "mongoose";
import { decrypt, encrypt } from "../helpers.js";

const meetingSchema = new mongoose.Schema({
    date: Date,
    type: String,
    month: String,
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
    beginSong: Number,
    beginPrayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
    midSong: Number,
    endSong: Number,
    endPrayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
    congregation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Congregation"
    },
    otherEndPrayer: {
        type: String,
        set: (otherEndPrayer) => encrypt(otherEndPrayer),
        get: (encryptedOtherEndPrayer) => decrypt(encryptedOtherEndPrayer),
    },
    assignments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MeetingAssignment"
        }
    ],
    audioVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AudioVideo"
    },
    ordinal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ordinal"
    },
    cleaningGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MinistryGroup"
    },
});

meetingSchema.set("toJSON", { getters: true })

export default mongoose.model("Meeting", meetingSchema)
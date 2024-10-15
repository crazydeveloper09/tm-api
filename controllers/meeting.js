import express from "express";
import Meeting from "../models/meeting.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import mongoose from "mongoose";
import { __dirname } from "../app.js";
import { months } from "../helpers.js";
import MeetingAssignment from "../models/meetingAssignment.js";
import ordinal from "../models/ordinal.js";
import audioVideo from "../models/audioVideo.js";
import i18n from "i18n";
const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const meetingPopulate = [
    "lead", 
    "beginPrayer",
    "cleaningGroup", 
    "endPrayer", 
    "assignments",
    { 
        path: 'assignments',
        populate: {
            path: 'participant',
            model: 'Preacher'
        } 
    }, 
    { 
        path: 'assignments',
        populate: {
            path: 'reader',
            model: 'Preacher'
        } 
    }, 
    "audioVideo",
    { 
        path: 'audioVideo',
        populate: {
            path: 'microphone1Operator',
            model: 'Preacher'
        } 
    }, 
    { 
        path: 'audioVideo',
        populate: {
            path: 'microphone2Operator',
            model: 'Preacher'
        } 
    }, 
    { 
        path: 'audioVideo',
        populate: {
            path: 'videoOperator',
            model: 'Preacher'
        } 
    }, 
    { 
        path: 'audioVideo',
        populate: {
            path: 'audioOperator',
            model: 'Preacher'
        } 
    },
    "ordinal",
    { 
        path: 'ordinal',
        populate: {
            path: 'hallway1',
            model: 'Preacher'
        } 
    }, 
    { 
        path: 'ordinal',
        populate: {
            path: 'hallway2',
            model: 'Preacher'
        } 
    }, 
    { 
        path: 'ordinal',
        populate: {
            path: 'auditorium',
            model: 'Preacher'
        } 
    }, 
    { 
        path: 'ordinal',
        populate: {
            path: 'parking',
            model: 'Preacher'
        } 
    },
]

export const getListOfMeetings = (req, res, next) => {
    
    const objectID = new mongoose.Types.ObjectId(req.user.congregation);
    const congregationID = req.user.username ? req.user._id : req.user.congregation;
    Meeting
        .find({ congregation: congregationID })
        .populate(meetingPopulate)
        .sort({ date: 1 })
        .exec()
        .then((meetings) => {
            res.json(meetings)
        })
        .catch((err) => console.log(err))
}

export const createMeeting = (req, res, next) => {
    i18n.setLocale(req.query.locale);
    let month = `${i18n.__(months[new Date(req.body.date).getMonth()])} ${new Date(req.body.date).getFullYear()}`;
    let newMeeting = {
        date: req.body.date,
        month,
        type: req.body.type,
        midSong: +req.body.midSong,
        endSong: +req.body.endSong
    }

    Meeting
        .create(newMeeting)
        .then((createdMeeting) => {
            const congregationID = req.user.username ? req.user._id : req.user.congregation;
            createdMeeting.congregation = congregationID;
            if(req.body.otherEndPrayer !== ""){
                createdMeeting.otherEndPrayer = req.body.otherEndPrayer;
            }
            if(req.body.cleaningGroup !== ""){
                createdMeeting.cleaningGroup = req.body.cleaningGroup;
            }
            if(req.body.lead !== ""){
                createdMeeting.lead = req.body.lead;
                sendNotificationToPreacher(req.body.lead, i18n.__("leadLabel"), createdMeeting.date)
            }
            if(req.body.beginSong !== ""){
                createdMeeting.beginSong = +req.body.beginSong;
            }
            if(req.body.beginPrayer !== ""){
                createdMeeting.beginPrayer = req.body.beginPrayer;
                sendNotificationToPreacher(req.body.beginPrayer, i18n.__("beginPrayerLabel"), createdMeeting.date)
            }
            if(req.body.endPrayer !== ""){
                createdMeeting.endPrayer = req.body.endPrayer;
                sendNotificationToPreacher(req.body.endPrayer, i18n.__("endPrayerLabel"), createdMeeting.date)
            }
            createdMeeting.save();
            res.json(createdMeeting);
        })
        .catch((err) => console.log(err))
}



export const editMeeting = (req, res, next) => {
    i18n.setLocale(req.query.locale);
    Meeting
        .findById(req.params.meeting_id)
        .exec()
        .then((meeting) => {
            if(req.body.meeting.otherEndPrayer !== ""){
                meeting.otherEndPrayer = req.body.meeting.otherEndPrayer;
            }
            if(req.body.meeting.cleaningGroup !== ""){
                meeting.cleaningGroup = req.body.meeting.cleaningGroup;
            }
            if(req.body.meeting.lead !== ""){
                meeting.lead = req.body.meeting.lead;
                sendNotificationToPreacher(req.body.meeting.lead, i18n.__("leadLabel"), meeting.date)
            }
            if(req.body.meeting.beginSong !== ""){
                meeting.beginSong = +req.body.meeting.beginSong;
            }
            if(req.body.meeting.beginPrayer !== ""){
                meeting.beginPrayer = req.body.meeting.beginPrayer;
                sendNotificationToPreacher(req.body.meeting.beginPrayer, i18n.__("beginPrayerLabel"), meeting.date)
            }
            if(req.body.meeting.endPrayer !== ""){
                meeting.endPrayer = req.body.meeting.endPrayer;
                sendNotificationToPreacher(req.body.meeting.endPrayer, i18n.__("endPrayerLabel"), meeting.date)
            }
            meeting.save();
            
            res.json(meeting);
        })
        .catch((err) => console.log(err))
}

export const deleteMeeting = (req, res, next) => {
    Meeting
        .findByIdAndDelete(req.params.meeting_id)
        .exec()
        .then((meeting) => {
            MeetingAssignment
                .deleteMany({ meeting: req.params.meeting_id })
                .then((deletedAssignments) => {
                    ordinal
                        .deleteMany({ meeting: req.params.meeting_id })
                        .then((deletedOrdinals) => {
                            audioVideo
                                .deleteMany({ meeting: req.params.meeting_id })
                                .then((deletedAudioVideos) => res.json(meeting))
                        })
                    
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
}

export const getListOfMeetingAssignmentsOfPreacher = (req, res, next) => {
    
    Meeting
        .find({ $or: [
                {lead: req.user._id}, 
                {beginPrayer: req.user._id}, 
                {endPrayer: req.user._id}, 
            ] 
        })
        .populate(meetingPopulate)
        .exec()
        .then((meetings) => {
            MeetingAssignment
                .find({ $or: [{participant: req.user._id}, {reader: req.user._id}]})
                .populate(["meeting", "reader"])
                .exec()
                .then((assignments) => {
                    res.json({meetings, assignments})
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
}


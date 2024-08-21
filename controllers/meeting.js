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
            if(req.body.otherEndPrayer){
                createdMeeting.otherEndPrayer = req.body.otherEndPrayer;
            }
            if(req.body.cleaningGroup){
                createdMeeting.cleaningGroup = req.body.cleaningGroup;
            }
            if(req.body.lead){
                createdMeeting.lead = req.body.lead;
            }
            if(req.body.beginSong){
                createdMeeting.beginSong = +req.body.beginSong;
            }
            if(req.body.beginPrayer){
                createdMeeting.beginPrayer = req.body.beginPrayer;
            }
            if(req.body.endPrayer){
                createdMeeting.endPrayer = req.body.endPrayer;
            }
            createdMeeting.save();
            res.json(createdMeeting);
        })
        .catch((err) => console.log(err))
}



export const editMeeting = (req, res, next) => {
    Meeting
        .findById(req.params.meeting_id)
        .exec()
        .then((meeting) => {
            console.log(req.body.meeting)
            meeting.otherEndPrayer = req.body.meeting.otherEndPrayer !== "" ? req.body.meeting.otherEndPrayer : undefined;
            meeting.lead = req.body.meeting.lead !== "" ? req.body.meeting.lead : undefined;
            meeting.cleaningGroup = req.body.meeting.cleaningGroup !== "" ? req.body.meeting.cleaningGroup : undefined;
            meeting.beginSong = req.body.meeting.beginSong !== "" ? req.body.meeting.beginSong : undefined;
            meeting.beginPrayer = req.body.meeting.beginPrayer !== "" ? req.body.meeting.beginPrayer : undefined;
       
            meeting.midSong = +req.body.meeting.midSong,
            meeting.endSong = +req.body.meeting.endSong
            
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


import express from "express";
import MeetingAssignment from "../models/meetingAssignment.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import { __dirname } from "../app.js";
import Meeting from "../models/meeting.js";
import { sendNotificationToPreacher } from "../notifications.js";
import i18n from "i18n";
const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const getListOfMeetingAssignments = (req, res, next) => {
    MeetingAssignment
        .find({ congregation: req.user._id })
        .populate("participant")
        .exec()
        .then((meetingAssignments) => {
            res.json(meetingAssignments)
        })
        .catch((err) => console.log(err))
}

export const createMeetingAssignment = (req, res, next) => {
    i18n.setLocale(req.query.locale);
  Meeting
                .findById(req.params.meeting_id)
                .exec()
                .then((meeting) => {
    let newMeetingAssignment = {
        topic: req.body.topic,
        defaultTopic: req.body.defaultTopic,
        type: req.body.type,
        meeting: req.params.meeting_id
    }

    MeetingAssignment
        .create(newMeetingAssignment)
        .then((createdMeetingAssignment) => {
            if(req.body.otherParticipant !== ""){
                createdMeetingAssignment.otherParticipant = req.body.otherParticipant;
            }
            if(req.body.participant !== ""){
                createdMeetingAssignment.participant = req.body.participant;
                sendNotificationToPreacher(req.body.participant, createdMeetingAssignment.topic || createdMeetingAssignment.defaultTopic, meeting.date)
            }
            if(req.body.reader !== ""){
                createdMeetingAssignment.reader = req.body.reader;
                sendNotificationToPreacher(req.body.reader, `${createdMeetingAssignment.topic || createdMeetingAssignment.defaultTopic} - ${i18n.__("readerLabel")}`, meeting.date)
            }
            if(req.body.helper !== ""){
                createdMeetingAssignment.helper = req.body.helper;
                sendNotificationToPreacher(req.body.helper, `${createdMeetingAssignment.topic || createdMeetingAssignment.defaultTopic} - ${i18n.__("helperLabel")}`, meeting.date)
            }
            createdMeetingAssignment.save();
      
             meeting.assignments.push(createdMeetingAssignment);
                    meeting.save();
                    res.json(createdMeetingAssignment);
        })
        .catch((err) => console.log(err))
                   
                })
                .catch((err) => console.log(err))
    
}



export const editMeetingAssignment = (req, res, next) => {
    i18n.setLocale(req.query.locale);
    MeetingAssignment
        .findById(req.params.meetingAssignment_id)
        .populate("meeting")
        .exec()
        .then((meetingAssignment) => {
            console.log(req.body.assignment)
            meetingAssignment.topic = req.body.assignment.topic;
            meetingAssignment.defaultTopic = req.body.assignment.defaultTopic;
            meetingAssignment.type = req.body.assignment.type;
            if(req.body.assignment.otherParticipant !== ""){
                meetingAssignment.otherParticipant = req.body.assignment.otherParticipant;
            }
            if(req.body.assignment.participant !== "" && meetingAssignment.participant?.toString() !== req.body.assignment.participant){
                meetingAssignment.participant = req.body.assignment.participant;
                sendNotificationToPreacher(req.body.participant, req.body.assignment.topic || req.body.assignment.defaultTopic, meetingAssignment.meeting.date)
            }
            if(req.body.assignment.reader !== "" && meetingAssignment.reader?.toString() !== req.body.assignment.reader){
                meetingAssignment.reader = req.body.assignment.reader;
                sendNotificationToPreacher(req.body.assignment.reader, `${req.body.assignment.topic || req.body.assignment.defaultTopic} - ${i18n.__("readerLabel")}`, meetingAssignment.meeting.date)
            }
            if(req.body.assignment.helper !== "" && meetingAssignment.helper?.toString() !== req.body.assignment.helper){
                meetingAssignment.helper = req.body.assignment.helper;
                console.log(req.body.assignment.helper)
                sendNotificationToPreacher(req.body.assignment.helper, `${req.body.assignment.topic || req.body.assignment.defaultTopic} - ${i18n.__("helperLabel")}`, meetingAssignment.meeting.date)
            }
            meetingAssignment.save();
            
            res.json(meetingAssignment);
        })
        .catch((err) => console.log(err))
}

export const deleteMeetingAssignment = (req, res, next) => {
    MeetingAssignment
        .findByIdAndDelete(req.params.meetingAssignment_id)
        .exec()
        .then((meetingAssignment) => {
            res.json(meetingAssignment)
        })
        .catch((err) => console.log(err))
}


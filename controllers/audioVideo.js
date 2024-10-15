import express from "express";
import AudioVideo from "../models/audioVideo.js";
import Ordinal from "../models/ordinal.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import { __dirname } from "../app.js";
import Meeting from "../models/meeting.js";
import { sendNotificationToPreacher } from "../notifications.js";
import i18n from "i18n";
const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const createAudioVideo = (req, res, next) => {
    let newAudioVideo = {
        meeting: req.params.meeting_id
    }
    i18n.setLocale(req.query.locale);
    AudioVideo
        .create(newAudioVideo)
        .then((createdAudioVideo) => {
            if(req.body.microphone2Operator !== ""){
                createdAudioVideo.microphone2Operator = req.body.microphone2Operator;
                sendNotificationToPreacher(req.body.microphone2Operator, i18n.__("mic2Label"), req.body.meetingDate)
            }
            if(req.body.audioOperator !== ""){
                createdAudioVideo.audioOperator = req.body.audioOperator;
                sendNotificationToPreacher(req.body.audioOperator, i18n.__("audioOperatorLabel"), req.body.meetingDate)
            }
            if(req.body.microphone1Operator !== ""){
                createdAudioVideo.microphone1Operator = req.body.microphone1Operator;
                sendNotificationToPreacher(req.body.microphone1Operator, i18n.__("mic1Label"), req.body.meetingDate)
            }
            if(req.body.videoOperator !== ""){
                createdAudioVideo.videoOperator = req.body.videoOperator;
                sendNotificationToPreacher(req.body.videoOperator, i18n.__("videoOperatorLabel"), req.body.meetingDate)
            }
            
            createdAudioVideo.save();
            Meeting
                .findById(req.params.meeting_id)
                .exec()
                .then((meeting) => {
                    meeting.audioVideo = createdAudioVideo;
                    meeting.save();
                    res.json(createdAudioVideo);
                })
                .catch((err) => console.log(err))
            
        })
        .catch((err) => console.log(err))
}



export const editAudioVideo = (req, res, next) => {
    i18n.setLocale(req.query.locale);
    AudioVideo
        .findById(req.params.audioVideo_id)
        .populate("meeting")
        .exec()
        .then((audioVideo) => {
            if(req.body.audioVideo.microphone2Operator !== ""){
                audioVideo.microphone2Operator = req.body.audioVideo.microphone2Operator;
                sendNotificationToPreacher(req.body.audioVideo.microphone2Operator, i18n.__("mic2Label"), audioVideo.meeting.date)
            }
            if(req.body.audioVideo.audioOperator !== ""){
                audioVideo.audioOperator = req.body.audioVideo.audioOperator;
                sendNotificationToPreacher(req.body.audioVideo.audioOperator, i18n.__("audioOperatorLabel"), audioVideo.meeting.date)
            }
            if(req.body.audioVideo.microphone1Operator !== ""){
                audioVideo.microphone1Operator = req.body.audioVideo.microphone1Operator;
                sendNotificationToPreacher(req.body.audioVideo.microphone1Operator, i18n.__("mic1Label"), audioVideo.meeting.date)
            }
            if(req.body.audioVideo.videoOperator !== ""){
                console.log(req.body.audioVideo.videoOperator);
                console.log(req.body.audioVideo)
                audioVideo.videoOperator = req.body.audioVideo.videoOperator;
                sendNotificationToPreacher(req.body.audioVideo.videoOperator, i18n.__("videoOperatorLabel"), audioVideo.meeting.date)
            }
            
            audioVideo.save();
            console.log(audioVideo)
            res.json(audioVideo);
        })
        .catch((err) => console.log(err))
}

export const deleteAudioVideo = (req, res, next) => {
    AudioVideo
        .findByIdAndDelete(req.params.audioVideo_id)
        .exec()
        .then((audioVideo) => {
            res.json(audioVideo)
        })
        .catch((err) => console.log(err))
}

export const loadAudioVideoAssignmentsOfPreacher = (req, res, next) => {
    AudioVideo
        .find({ $or: [
                {videoOperator: req.user._id}, 
                {audioOperator: req.user._id},
                {microphone1Operator: req.user._id},
                {microphone2Operator: req.user._id},
            ]
        })
        .populate([
            "meeting", 
            "videoOperator", 
            "audioOperator", 
            "microphone1Operator", 
            "microphone2Operator"
        ])
        .exec()
        .then((audioVideo) => {
            Ordinal
                .find({ $or: [
                        {hallway1: req.user._id}, 
                        {hallway2: req.user._id},
                        {auditorium: req.user._id},
                        {parking: req.user._id},
                    ]
                })
                .populate([
                    "meeting", 
                    "auditorium", 
                    "parking", 
                    "hallway1", 
                    "hallway2"
                ])
                .exec()
                .then((ordinals) => {
                    res.json({audioVideo, ordinals})
                })
                .catch((err) => console.log(err))
        })
        .catch((err) => console.log(err))
}


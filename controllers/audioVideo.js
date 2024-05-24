import express from "express";
import AudioVideo from "../models/audioVideo.js";
import Ordinal from "../models/ordinal.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import { __dirname } from "../app.js";
import Meeting from "../models/meeting.js";
const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const createAudioVideo = (req, res, next) => {
    let newAudioVideo = {
        videoOperator: req.body.videoOperator,
        microphone1Operator: req.body.microphone1Operator,
        meeting: req.params.meeting_id
    }

    AudioVideo
        .create(newAudioVideo)
        .then((createdAudioVideo) => {
            if(req.body.microphone2Operator){
                createdAudioVideo.microphone2Operator = req.body.microphone2Operator;
            }
            if(req.body.audioOperator){
                createdAudioVideo.audioOperator = req.body.audioOperator;
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
    AudioVideo
        .findById(req.params.audioVideo_id)
        .exec()
        .then((audioVideo) => {
            audioVideo.microphone2Operator = req.body.audioVideo.microphone2Operator !== "" ? req.body.audioVideo.microphone2Operator : undefined;
            audioVideo.audioOperator = req.body.audioVideo.audioOperator !== "" ? req.body.audioVideo.audioOperator : undefined;
            audioVideo.videoOperator = req.body.audioVideo.videoOperator !== "" ? req.body.audioVideo.videoOperator : undefined;
            audioVideo.microphone1Operator = req.body.audioVideo.microphone1Operator !== "" ? req.body.audioVideo.microphone1Operator : undefined;
            
            audioVideo.save();
            
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


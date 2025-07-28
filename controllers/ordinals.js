import express from "express";
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

export const createOrdinal = (req, res, next) => {
    i18n.setLocale(req.query.locale);
        Meeting
                .findById(req.params.meeting_id)
                .exec()
                .then((meeting) => {
            let newOrdinal = {
        meeting: req.params.meeting_id
    }

    Ordinal
        .create(newOrdinal)
        .then((createdOrdinal) => {
            if(req.body.hallway1 !== ""){
                createdOrdinal.hallway1 = req.body.hallway1;
                sendNotificationToPreacher(req.body.hallway1, i18n.__("hallwayLabel"), meeting.date)
            }
            if(req.body.auditorium !== ""){
                createdOrdinal.auditorium = req.body.auditorium;
                sendNotificationToPreacher(req.body.auditorium, i18n.__("auditoriumLabel"), meeting.date)
            }
            if(req.body.hallway2 !== ""){
                createdOrdinal.hallway2 = req.body.hallway2;
                sendNotificationToPreacher(req.body.hallway2, i18n.__("hallway2Label"), meeting.date)
            }
            if(req.body.parking !== ""){
                createdOrdinal.parking = req.body.parking;
                sendNotificationToPreacher(req.body.parking, i18n.__("parkingLabel"), meeting.date)
            }
            if(req.body.zoom !== ""){
                createdOrdinal.zoom = req.body.zoom;
                sendNotificationToPreacher(req.body.zoom, i18n.__("zoomLabel"), meeting.date)
            }
            
            createdOrdinal.save();
            meeting.ordinal = createdOrdinal;
            meeting.save();
            res.json(createdOrdinal);
            
        })
        .catch((err) => console.log(err))
                    
                })
                .catch((err) => console.log(err))
  
}



export const editOrdinal = (req, res, next) => {
    i18n.setLocale(req.query.locale);
    Ordinal
        .findById(req.params.ordinal_id)
        .exec()
        .then((ordinal) => {
            if(req.body.attendant.hallway1 !== "" && ordinal.hallway1?.toString() !== req.body.attendant.hallway1){
                ordinal.hallway1 = req.body.attendant.hallway1;
                sendNotificationToPreacher(req.body.attendant.hallway1, i18n.__("hallwayLabel"), req.body.meetingDate)
            }
            if(req.body.attendant.auditorium !== "" && ordinal.auditorium?.toString() !== req.body.attendant.auditorium){
                ordinal.auditorium = req.body.attendant.auditorium;
                sendNotificationToPreacher(req.body.attendant.auditorium, i18n.__("auditoriumLabel"), req.body.meetingDate)
            }
            if(req.body.attendant.hallway2 !== "" && ordinal.hallway2?.toString() !== req.body.attendant.hallway2){
                ordinal.hallway2 = req.body.attendant.hallway2;
                sendNotificationToPreacher(req.body.attendant.hallway2, i18n.__("hallway2Label"), req.body.meetingDate)
            }
            if(req.body.attendant.parking !== "" && ordinal.parking?.toString() !== req.body.attendant.parking){
                ordinal.parking = req.body.attendant.parking;
                sendNotificationToPreacher(req.body.attendant.parking, i18n.__("parkingLabel"), req.body.meetingDate)
            }
            if(req.body.attendant.zoom !== "" && ordinal.zoom?.toString() !== req.body.attendant.zoom){
                ordinal.zoom = req.body.attendant.zoom;
                sendNotificationToPreacher(req.body.attendant.zoom, i18n.__("zoomLabel"), req.body.meetingDdate)
            }

            
            ordinal.save();
            
            res.json(ordinal);
        })
        .catch((err) => console.log(err))
}

export const deleteOrdinal = (req, res, next) => {
    Ordinal
        .findByIdAndDelete(req.params.ordinal_id)
        .exec()
        .then((ordinal) => {
            res.json(ordinal)
        })
        .catch((err) => console.log(err))
}


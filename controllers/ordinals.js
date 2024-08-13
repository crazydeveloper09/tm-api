import express from "express";
import Ordinal from "../models/ordinal.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import { __dirname } from "../app.js";
import Meeting from "../models/meeting.js";
const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const createOrdinal = (req, res, next) => {
    let newOrdinal = {
        hallway1: req.body.hallway1,
        auditorium: req.body.auditorium,
        meeting: req.params.meeting_id
    }

    Ordinal
        .create(newOrdinal)
        .then((createdOrdinal) => {
            createdOrdinal.hallway2 = req.body.hallway2 !== "" ? req.body.hallway2 : undefined;
            createdOrdinal.parking = req.body.parking !== "" ? req.body.parking : undefined;
            
            createdOrdinal.save();
            Meeting
                .findById(req.params.meeting_id)
                .exec()
                .then((meeting) => {
                    meeting.ordinal = createdOrdinal;
                    meeting.save();
                    res.json(createdOrdinal);
                })
                .catch((err) => console.log(err))
            
        })
        .catch((err) => console.log(err))
}



export const editOrdinal = (req, res, next) => {
    Ordinal
        .findById(req.params.ordinal_id)
        .exec()
        .then((ordinal) => {
            ordinal.hallway2 = req.body.ordinal.hallway2 !== "" ? req.body.ordinal.hallway2 : undefined;
            ordinal.parking = req.body.ordinal.parking !== "" ? req.body.ordinal.parking : undefined;
            ordinal.hallway1 = req.body.ordinal.hallway1;
            ordinal.auditorium = req.body.ordinal.auditorium;
            
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


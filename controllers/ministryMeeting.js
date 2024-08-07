import express from "express";
import MinistryMeeting from "../models/ministryMeeting.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import { __dirname } from "../app.js";
import { months } from "../helpers.js";
import i18n from "i18n";
const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const getListOfMinistryMeetings = (req, res, next) => {
    const congregationID = req.user.username ? req.user._id : req.user.congregation;
    MinistryMeeting
        .find({ congregation: congregationID })
        .populate("lead")
        .exec()
        .then((ministryMeetings) => {
            res.json(ministryMeetings)
        })
        .catch((err) => console.log(err))
}

export const getListOfMinistryMeetingsOfPreacher = (req, res, next) => {
    const congregationID = req.user.username ? req.user._id : req.user.congregation;
    MinistryMeeting
        .find({ $and: [{ congregation: congregationID }, {lead: req.user._id}] })
        .populate("lead")
        .sort({ date: 1 })
        .exec()
        .then((ministryMeetings) => {
            res.json(ministryMeetings)
        })
        .catch((err) => console.log(err))
}

export const createMinistryMeeting = (req, res, next) => {
    i18n.setLocale(req.query.locale);
    let month = `${i18n.__(months[new Date(req.body.date).getMonth()])} ${new Date(req.body.date).getFullYear()}`;
    let newMinistryMeeting = {
        place: req.body.place,
        defaultPlace: req.body.defaultPlace,
        hour: req.body.hour,
        date: req.body.date,
        month,
    }

    MinistryMeeting
        .create(newMinistryMeeting)
        .then((createdMinistryMeeting) => {
            const congregationID = req.user.username ? req.user._id : req.user.congregation;
            createdMinistryMeeting.congregation = congregationID;
            if(req.body.topic){
                createdMinistryMeeting.topic = req.body.topic;
            }
            if(req.body.lead){
                createdMeeting.lead = req.body.lead;
            }
            createdMinistryMeeting.save();
            res.json(createdMinistryMeeting);
        })
        .catch((err) => console.log(err))
}



export const editMinistryMeeting = (req, res, next) => {
    MinistryMeeting
        .findByIdAndUpdate(req.params.ministryMeeting_id, req.body.ministryMeeting)
        .exec()
        .then((ministryMeeting) => {
            if(req.body.ministryMeeting.topic){
                ministryMeeting.topic = req.body.ministryMeeting.topic;
                ministryMeeting.save();
            }
            if(req.body.ministryMeeting.lead){
                ministryMeeting.lead = req.body.ministryMeeting.lead;
            }
            
            res.json(ministryMeeting);
        })
        .catch((err) => console.log(err))
}

export const deleteMinistryMeeting = (req, res, next) => {
    MinistryMeeting
        .findByIdAndDelete(req.params.ministryMeeting_id)
        .exec()
        .then((ministryMeeting) => {
            res.json(ministryMeeting)
        })
        .catch((err) => console.log(err))
}


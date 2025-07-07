import express from "express";
import MinistryGroup from "../models/ministryGroup.js";
import Preacher from "../models/preacher.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import { __dirname } from "../app.js";
const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const getListOfMinistryGroups = (req, res, next) => {
    const congregationID = req.user.username ? String(req.user._id) : req.user.congregation;
    MinistryGroup
        .find({ congregation: congregationID })
        .populate(["preachers", "overseer"])
        .exec()
        .then((ministryGroups) => {
            res.json(ministryGroups)
        })
        .catch((err) => console.log(err))
}

export const createMinistryGroup = (req, res, next) => {
    MinistryGroup
        .create({name: req.body.name})
        .then((createdMinistryGroup) => {
            createdMinistryGroup.congregation = req.user._id;
            createdMinistryGroup.preachers = typeof req.body.preachers === 'string' ? [req.body.preachers] : [...req.body.preachers];
            createdMinistryGroup.overseer = req.body.overseer;
            createdMinistryGroup.save();
            res.json(createdMinistryGroup);
        })
        .catch((err) => console.log(err))
}



export const editMinistryGroup = (req, res, next) => {
    MinistryGroup
        .findById(req.params.ministryGroup_id)
        .exec()
        .then((ministryGroup) => {
            ministryGroup.name = req.body.ministryGroup.name;
            ministryGroup.preachers = typeof req.body.ministryGroup.preachers === 'string' ? [req.body.ministryGroup.preachers] : [...req.body.ministryGroup.preachers];
            ministryGroup.overseer = req.body.ministryGroup.overseer;
            ministryGroup.save();
            res.json(ministryGroup);
        })
        .catch((err) => console.log(err))
}

export const deleteMinistryGroup = (req, res, next) => {
    MinistryGroup
        .findByIdAndDelete(req.params.ministryGroup_id)
        .exec()
        .then((ministryGroup) => {
            res.json(ministryGroup)
        })
        .catch((err) => console.log(err))
}


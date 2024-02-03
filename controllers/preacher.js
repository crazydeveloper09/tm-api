import express from "express";
import Preacher from "../models/preacher.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import { escapeRegex } from "../helpers.js";
import Territory from "../models/territory.js";
import Checkout from "../models/checkout.js";

const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const getListOfPreachers = (req, res, next) => {
    const paginationOptions = {
        limit: req.query.limit || 10,
        page: req.query.page || 1,
        sort: {name: 1}
    }
    Preacher
        .paginate({congregation: req.user._id}, paginationOptions)
        .then((result) => {
            res.json(result);
        })
        .catch((err) => console.log(err))
}

export const getPreacherInfo = (req, res, next) => {
    Preacher
        .findById(req.params.preacher_id)
        .exec()
        .then((preacher) => res.json(preacher))
        .catch((err) => res.status(422).json(err))
}

export const getAllPreachers = (req, res, next) => {
    Preacher
    .find({congregation: req.user._id})
    .sort({name: 1})
    .exec()
    .then((preachers) => {
        res.json(preachers)
    })
    .catch((err) => console.log(err))
}

export const createPreacher = (req, res, next) => {
    Preacher
        .create({name: req.body.name})
        .then((createdPreacher) => {
            createdPreacher.congregation = req.user._id;
            createdPreacher.save();
            res.json(createdPreacher);
        })
        .catch((err) => console.log(err))
}

export const editPreacher = (req, res, next) => {
    Preacher
        .findByIdAndUpdate(req.params.preacher_id, req.body.preacher)
        .exec()
        .then((preacher) => {
            preacher.name = req.body.preacher.name;
            preacher.save();
            res.json(preacher);
        })
        .catch((err) => console.log(err))
}

export const deletePreacher = (req, res, next) => {
    Preacher
        .findByIdAndDelete(req.params.preacher_id)
        .exec()
        .then((preacher) => {
            Territory
                .find({ preacher: preacher._id })
                .exec()
                .then((territories) => {
                    territories.forEach((territory) => {
                        territory.preacher = undefined;
                        territory.type = 'free';
                        territory.save()
                    })
                    Checkout
                        .find({ preacher: preacher._id })
                        .exec()
                        .then(async (checkouts) => {
                        
                                if(checkouts.length === 0){
                                    res.json(preacher)
                                } else {    
                                    const oldPreacher = await Preacher.findOne({ name: 'Były głosiciel' }).exec();
                                    if(oldPreacher){
                                        checkouts.forEach((checkout) => {
                                            checkout.preacher = oldPreacher;
                                            checkout.save();
                                            
                                        })
                                        res.json(preacher)
                                    } else {
                                        const newPreacher = await Preacher.create({ name: 'Były głosiciel', congregation: req.user._id});
                                        checkouts.forEach((checkout) => {
                                            checkout.preacher = newPreacher;
                                            checkout.save();
                                        })
                                        res.json(preacher)
                                    }
                                }
                            
                        })
                        .catch((err) => console.log(err))
                })
        })
        .catch((err) => console.log(err))
}


export const searchPreachers = (req, res, next) => {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Preacher
        .find({
            $and: [
                {name: regex}, 
                {congregation: req.user._id}
            ]
        })
        .sort({name: 1})
        .exec()
        .then((preachers) => {
            res.json(preachers)
        })
        .catch((err) => console.log(err))
}
import express from "express";
import Preacher from "../models/preacher.js";
import flash from "connect-flash";
import methodOverride from "method-override";
import { escapeRegex } from "../helpers.js";
import Territory from "../models/territory.js";

const app = express();

app.use(flash());
app.use(methodOverride("_method"))

export const renderListOfPreachers = (req, res, next) => {
    Preacher
        .find({congregation: req.user._id})
        .sort({name: 1})
        .exec()
        .then((preachers) => {
            res.render("./preachers/index", { 
                currentUser: req.user, 
                preachers: preachers, 
                header: `Głosiciele zboru ${req.user.username} | Territory Manager`, 
                pre: ""  
            });
        })
        .catch((err) => console.log(err))
}

export const renderNewPreacherForm = (req, res, next) => {
    res.render("./preachers/new", { 
        currentUser: req.user, 
        header: "Dodaj głosiciela | Territory Manager", 
        newP: "" 
    });
}

export const createPreacher = (req, res, next) => {
    Preacher
        .create({name: req.body.name})
        .then((createdPreacher) => {
            createdPreacher.congregation = req.user._id;
            createdPreacher.save();
            res.redirect("/preachers");
        })
        .catch((err) => console.log(err))
}

export const renderPreacherEditForm = (req, res, next) => {
    Preacher
        .findById(req.params.preacher_id)
        .exec()
        .then((preacher) => {
            res.render("./preachers/edit", { 
                currentUser: req.user, 
                preacher: preacher, 
                header: `Edytuj głosiciela w zborze ${req.user.username} | Territory Manager`
            });
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
            res.redirect("/preachers");
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
                    res.redirect("/preachers")
                })
        })
        .catch((err) => console.log(err))
}

export const confirmDeletingPreacher = (req, res, next) => {
    Preacher
        .findById(req.params.preacher_id)
        .exec()
        .then((preacher) => {
            res.render("./preachers/deleteConfirm", {
                preacher: preacher,
                currentUser: req.user,
                header: `Potwierdzenie usunięcia głosiciela | Territory Manager`
            });
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
            res.render("./preachers/search", {
                param: req.query.search, 
                preachers: preachers, 
                currentUser: req.user,
                header: "Szukaj głosicieli | Territory Manager"
            });
        })
        .catch((err) => console.log(err))
}
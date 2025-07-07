import express from "express";
import Congregation from "../models/congregation.js";
import MinistryGroup from "../models/ministryGroup.js";
import flash from "connect-flash";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import node_geocoder from "node-geocoder";
import methodOverride from "method-override";
import { sendEmail } from "../helpers.js";
import Activity from "../models/activity.js";
import i18n from "i18n";

dotenv.config();

const app = express();
app.use(flash());
app.use(methodOverride("_method"));

let options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
  };
let geocoder = node_geocoder(options);


export const getCongregationInfo = (req, res, next) => {
  const congregationID = req.user.username ? req.user._id : req.user.congregation;
    Congregation
        .findById(congregationID)
        .populate(["preacher", "territories"])
        .exec()
        .then((congregation) => {
            res.json({ congregation })
        })
        .catch((err) =>  console.log(err))
}

export const editCongregation = (req, res, next) => {
    Congregation
        .findByIdAndUpdate(req.params.congregation_id, req.body.congregation)
        .exec()
        .then((congregation) => {
            res.json(congregation)
        })
        .catch((err) => console.log(err))
}

export const registerCongregation = (req, res, next) => {
    i18n.setLocale(req.query.locale);
            let verificationCode = '';
            for (let i = 0; i <= 5; i++) {
                let number = Math.floor(Math.random() * 10);
                let numberString = number.toString();
                verificationCode += numberString;
            }
            let newUser = new Congregation({
                username: req.body.username,
                territoryServantEmail: req.body.mainAdminEmail,
                ministryOverseerEmail: req.body.secondAdminEmail,
                verificationNumber: verificationCode,
                verificationExpires: Date.now() + 360000
            });
            Congregation.register(newUser, req.body.password, function(err, congregation) {
                if(err) {
                    
                    return res.send(err.message);
                } 
                passport.authenticate("local")(req, res, function() {
                    const subject = i18n.__("emailVerificationTitle");
                    const emailText = i18n.__("emailVerificationMessage");
                    sendEmail(subject, congregation.territoryServantEmail, emailText, congregation)
                    sendEmail(subject, congregation.ministryOverseerEmail, emailText, congregation)
                    res.json({userID: congregation._id});
                });
            });
    
}

export const verifyCongregation = (req, res, next) => {
    i18n.setLocale(req.language);
    Congregation
        .findOne({
            $and: [
                {_id: req.params.congregation_id},
                {verificationExpires: { $gt: Date.now()}},
            ]
        })
        .exec()
        .then((congregation) => {
            if(congregation){
                if(congregation.verificationNumber === +req.body.code){
                    congregation.verificated = true;
                    congregation.save();
        
                    const token = jwt.sign({ userId: congregation._id }, process.env.JWT_SECRET)
                    res.send({message: `Witaj w Congregation Planner`, token})
                } else {
                    res.json(i18n.__("wrongCode"))
                }
            } else {
                res.json(i18n.__("expiredCode"))
            }
        })
        .catch((err) => console.log(err))
}

export const resendVerificationCode = (req, res, next) => {
    i18n.setLocale(req.query.locale);
    Congregation
        .findById(req.params.congregation_id)
        .exec()
        .then((congregation) => {
            let verificationCode = '';
            for (let i = 0; i <= 5; i++) {
                let number = Math.floor(Math.random() * 10);
                let numberString = number.toString();
                verificationCode += numberString;
            }
            congregation.verificationNumber = verificationCode;
            congregation.verificationExpires = Date.now() + 360000;
            congregation.save()
            const subject = i18n.__("resendEmailVerificationTitle");
            const emailText = i18n.__("resendEmailVerificationMessage");
            sendEmail(subject, congregation.territoryServantEmail, emailText, congregation)
            sendEmail(subject, congregation.ministryOverseerEmail, emailText, congregation)
            res.json("Poprawnie wysłano kod weryfikacyjny");
        })
        .catch((err) => console.log(err))
}



export const verifyTwoFactor = (req, res, next) => {
    Congregation
        .findOne({
            $and: [
                {_id: req.params.congregation_id},
                {verificationExpires: { $gt: Date.now()}},
                {verificationNumber: +req.body.code}
            ]
        })
        .exec()
        .then((congregation) => {
            if(congregation){
                const token = jwt.sign({ userId: congregation._id }, process.env.JWT_SECRET)
                res.send({message: `Pomyślnie zalogowałeś się do ${req.query.app ? 'Congregation Planner': 'Territory Manager'}`, token})
            } else {
                res.status(422).send("Kod weryfikacyjny wygasł lub nie ma takiego konta. Kliknij przycisk Wyślij kod ponownie poniżej ")
            }
        })
        .catch((err) => console.log(err))
}

export const resendTwoFactorCode = (req, res, next) => {
    Congregation
        .findById(req.params.congregation_id)
        .exec()
        .then((congregation) => {
            let verificationCode = '';
            for (let i = 0; i <= 5; i++) {
                let number = Math.floor(Math.random() * 10);
                let numberString = number.toString();
                verificationCode += numberString;
            }
            congregation.verificationNumber = verificationCode;
            congregation.verificationExpires = Date.now() + 360000;
            congregation.save()
            const subject = 'Ponowne wysłanie kodu weryfikacyjnego';
            let emailText = `Właśnie dostałem prośbę o ponowne wysłanie kodu do
            dwustopniowej weryfikacji logowania do Territory Manager.
            Jeśli to nie byłeś ty, zignoruj wiadomość.`;
            
            sendEmail(subject, congregation.territoryServantEmail, emailText, congregation, req.query.app)
            sendEmail(subject, congregation.ministryOverseerEmail, emailText, congregation, req.query.app)
            res.send("Poprawnie wysłano kod do dwustopniwej weryfikacji");
        })
        .catch((err) => console.log(err))
}

export const getAllCongregationActivities = (req, res, next) => {
    Activity
        .find({ $and: [{ congregation: req.params.congregation_id }, { appName: req.query.app }] })
        .exec()
        .then((activities) => res.json(activities))
        .catch((err) => console.log(err))
}
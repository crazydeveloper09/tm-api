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
    console.log('request reached')
    Congregation
        .findById(req.user._id)
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
            geocoder.geocode(req.body.congregation.mainCity, function (err, data) {
                if (err || !data.length) {
                    return res.send(err.message);
                }

                congregation.mainCity = req.body.congregation.mainCity;
                congregation.mainCityLatitude = data[0].latitude;
                congregation.mainCityLongitude = data[0].longitude;
                congregation.save();
                res.json(congregation)
            });
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
                res.send({message: `Pomyślnie zalogowałeś się do Territory Manager`, token})
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
            
            sendEmail(subject, congregation.territoryServantEmail, emailText, congregation)
            sendEmail(subject, congregation.ministryOverseerEmail, emailText, congregation)
            res.send("Poprawnie wysłano kod do dwustopniwej weryfikacji");
        })
        .catch((err) => console.log(err))
}

export const getAllCongregationActivities = (req, res, next) => {
    Activity
        .find({ congregation: req.params.congregation_id })
        .exec()
        .then((activities) => res.json(activities))
        .catch((err) => console.log(err))
}
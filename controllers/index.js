import express from "express";
import flash from "connect-flash";
import passport from "passport";
import methodOverride from "method-override";
import { sendEmail } from "../helpers.js";
import Activity from "../models/activity.js";
import ipWare from "ipware";
import i18n from "i18n";
import { addPushToken } from "../notifications.js";

const app = express();
const getIP = ipWare().get_ip;

app.use(flash());
app.use(methodOverride("_method"));


export const authenticateCongregation = (req, res, next) => {
    i18n.setLocale(req.query.locale);
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            return res.send(i18n.__("badLogIn"));
        }
        if(user.verificated){
            req.logIn(user, function (err) {
        
                if (err) { return next(err); }

                let verificationCode = '';
                for (let i = 0; i <= 5; i++) {
                    let number = Math.floor(Math.random() * 10);
                    let numberString = number.toString();
                    verificationCode += numberString;
                }
                user.verificationNumber = verificationCode;
                user.verificationExpires = Date.now() + 360000;
                user.save()
                const subject = i18n.__("twoFactorTitle");
                const emailText = `${i18n.__("twoFactorFirstPart")} ${req.query.app ? i18n.__("twoFactorSecondPartPlanner") : i18n.__("twoFactorSecondPartTerritory")}. ${i18n.__("twoFactorThirdPart")}`;
                sendEmail(subject, user.territoryServantEmail, emailText, user, req.query.app)
                sendEmail(subject, user.ministryOverseerEmail, emailText, user, req.query.app)
                let ipInfo = getIP(req);
                Activity
                    .create({ipAddress: ipInfo.clientIp, platform: req.header('sec-ch-ua-platform'), userAgent: req.header('user-agent'), applicationType: 'Aplikacja mobilna', congregation: user._id})
                    .then((createdActivity) => {
                        if(req.query.app){
                            createdActivity.appName = req.query.app;
                            createdActivity.save();
                        }
                        if(user.username === "Testy aplikacji mobilnej") {
                            return  res.send({ message: `${i18n.__("successfulLogInWithCode")} ${verificationCode}`, userID: user._id})
                        }
                        res.send({ message: i18n.__("successfulLogIn"), userID: user._id})
                    })
                    .catch((err) => res.send(err))
            });
        } else {
            res.redirect(`/congregations/${user._id}/verification`)
        }
      
    })(req, res, next);
}

export const logOutCongregation = (req, res, next) => {
    req.logout();
    res.send("Poprawnie wylogowano");
}

export const registerDevice = async (req, res, next) => {
    if(req.body.preacherId) {
      await addPushToken(req.body.preacherId.replaceAll('"', ''), req.body.token);
      res.json("Successfully added device to send notifications")
    }
    return null;
}
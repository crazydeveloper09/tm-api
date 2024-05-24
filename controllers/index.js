import express from "express";
import flash from "connect-flash";
import passport from "passport";
import methodOverride from "method-override";
import { sendEmail } from "../helpers.js";
import Activity from "../models/activity.js";
import ipWare from "ipware";

const app = express();
const getIP = ipWare().get_ip;

app.use(flash());
app.use(methodOverride("_method"));


export const authenticateCongregation = (req, res, next) => {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            return res.send("Zła nazwa użytkownika lub hasło");
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
                const subject = 'Potwierdź swoją tożsamość';
                const emailText = `Zanim będziesz mógł zarządzać ${req.query.app ? 'planami zborowymi chcę mieć pewność, że loguje się administrator' : 'terenami chcę mieć pewność, że loguje się sługa terenu lub nadzorca służby'}. Proszę wpisz na stronie poniższy kod weryfikacyjny.`;
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
                            return  res.send({ message: `Poprawnie zalogowano. Twój kod to: ${verificationCode}`, userID: user._id})
                        }
                        res.send({ message: "Poprawnie zalogowano", userID: user._id})
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

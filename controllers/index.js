import express from "express";
import flash from "connect-flash";
import passport from "passport";
import methodOverride from "method-override";
import { sendEmail } from "../helpers.js";

const app = express();

app.use(flash());
app.use(methodOverride("_method"));


export const authenticateCongregation = (req, res, next) => {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            console.log(req.body)
            return res.send("Zła nazwa użytkownika lub hasło");
        }
        if(user.verificated){
            req.logIn(user, function (err) {
                console.log(info)
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
                const emailText = `Zanim będziesz mógł zarządzać terenami
                chcę mieć pewność, że loguje się sługa terenu lub nadzorca służby. Proszę wpisz na stronie poniższy kod weryfikacyjny.`;
                sendEmail(subject, user.territoryServantEmail, emailText, user)
                sendEmail(subject, user.ministryOverseerEmail, emailText, user)
                
                return res.send({ message: "Poprawnie zalogowano", userID: user._id});
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

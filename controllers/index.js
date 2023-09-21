import express from "express";
import flash from "connect-flash";
import passport from "passport";
import methodOverride from "method-override";
import { sendEmail } from "../helpers.js";

const app = express();

app.use(flash());
app.use(methodOverride("_method"));

export const redirectToLogin = (req, res, next) => {
    res.redirect("/login");
}

export const renderLoginForm = (req, res, next) => {
    res.render("login", {
        header: "Logowanie | Territory Manager"
    });
}

export const renderPrivacyPolicy = (req, res, next) => {
    res.render("policy", {
        header: "Polityka Prywatności i klauzula RODO | Territory Manager"
    });
}

export const authenticateCongregation = (req, res, next) => {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            req.flash("error", "Zła nazwa użytkownika lub hasło");
            return res.redirect(`/login`);
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
                return res.redirect(`/congregations/${user._id}/two-factor`);
            });
        } else {
            res.redirect(`/congregations/${user._id}/verification`)
        }
      
    })(req, res, next);
}

export const logOutCongregation = (req, res, next) => {
    req.logout();
    res.redirect("/login");
}

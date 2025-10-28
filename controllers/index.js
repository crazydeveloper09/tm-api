import express from "express";
import flash from "connect-flash";
import passport from "passport";
import methodOverride from "method-override";
import { sendEmail, encrypt, sendNotificationEmail, sendEmailWithLink, hashEmail } from "../helpers.js";
import Activity from "../models/activity.js";
import ipWare from "ipware";
import i18n from "i18n";
import { addPushToken } from "../notifications.js";
import Congregation from "../models/congregation.js";
import crypto from 'crypto';
import mailgun from 'mailgun-js';

const app = express();
const getIP = ipWare().get_ip;

app.use(flash());
app.use(methodOverride("_method"));

export const redirectToApp = (req, res, next) => {
  res.redirect("https://app.congregationplanner.pl")
}

export const renderForgotForm = (req, res, next) => {
    i18n.setLocale(req.language);
    res.render("forgot", {
        header: `${i18n.__("forgotPasswordHeader")} | Congregation Planner`
    });
}

export const editCongregationEmailHash = (req, res, next) => {
  Congregation
    .find({})
    .exec()
    .then((congregations) => {
      for(let congreagation of congregations){
        congreagation.territoryServantEmailHash = hashEmail(congreagation.territoryServantEmail);
        congreagation.ministryOverseerEmailHash = hashEmail(congreagation.ministryOverseerEmail || "");
        congreagation.save();
      }
      res.json("done")
    })
}

export const sendPasswordResetEmail = (req, res, next) => {
  i18n.setLocale(req.language);
  Congregation
    .findOne({ username: req.body.username })
    .exec()
    .then(async (congregation) => {
      let token = crypto.randomBytes(20).toString('hex');
      congregation.resetPasswordToken = token;
      congregation.resetPasswordExpires = Date.now() + 360000;
      congregation.save();

      let resetEmailTitle = i18n.__("resetEmailTitle");
      let linkText = i18n.__("resetLinkLabel");
      let linkURL = 'https://' + req.headers.host + '/reset/' + token;
      let text = i18n.__("resetEmailText");

      await sendEmailWithLink(resetEmailTitle, congregation.territoryServantEmail, text, congregation, linkURL, linkText);
      await sendEmailWithLink(resetEmailTitle, congregation.ministryOverseerEmail, text, congregation, linkURL, linkText);

      req.flash("success", i18n.__("resetEmailSuccess"));
      res.redirect("/forgot")
    })
    .catch((err) => console.log(err))
}

export const renderResetForm = (req, res, next) => {
  i18n.__(req.language);
  Congregation
    .findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }})
    .exec()
    .then((congregation) => {
        if(!congregation) {
            req.flash("error", i18n.__("resetPasswordTokenError"));
            return res.redirect("/forgot");
        }
        let header = `${i18n.__("resetPasswordHeader")} | Congregation Planner`;
        res.render("reset", { token: req.params.token, header: header });
    })
    .catch((err) => console.log(err))
}


export const resetPassword = (req, res, next) => {
  i18n.__(req.language);
  Congregation
    .findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }})
    .exec()
    .then((congregation) => {
        if(!congregation) {
            req.flash("error", i18n.__("resetPasswordTokenError"));
            return res.redirect("/forgot");
        }
       if (req.body.password === req.body.confirm) {
         congregation.setPassword(req.body.password, function (err) {
            congregation.resetPasswordExpires = undefined;
            congregation.resetPasswordToken = undefined;
            congregation.save();
            res.redirect("/reset/success")
         });
       } else {
         req.flash("error", i18n.__("passwordsNotTheSame"));
         return res.redirect("back");
       }
    })
    .catch((err) => console.log(err))
}

export const renderResetSuccessPage = (req, res, next) => {
  i18n.setLocale(req.language)
  res.render("reset_success", { header: `${i18n.__("resetPasswordSuccessHeader")} | Congregation Planner` })
}

export const renderLoginForm = (req, res, next) => {
    i18n.setLocale(req.language);
    let ipInfo = getIP(req);
    res.render("login", {
        header: `${i18n.__("loginHeader")} | Congregation Planner`,
        ipInfo
    });
}

export const sendSupportEmail = (req, res, next) => {
  const DOMAIN = 'websiteswithpassion.pl';
    const mg = mailgun({ apiKey: process.env.MAILGUN_API_KEY, domain: DOMAIN, host: "api.eu.mailgun.net" });
    const title = `Właśnie ktoś poprosił o kontakt w Congregation Planner. Oto szczegóły: `;
    const details = `Imię i nazwisko: <strong>${req.body.name}</strong> <br> Krótki opis: <strong>${req.body.shortDescription}</strong> <br> Dłuższy opis: <strong>${req.body.detailedDescription}</strong> <br> Email kontaktowy: <strong>${req.body.email}</strong>`
    const data = {
        from: `Powiadomienie o nowej prośbie <admin@websiteswithpassion.pl>`,
        to: "congregationplanner33@gmail.com",
        subject: "Nowa prośba o wsparcie",
        template: "powiadomienie",
        "h:X-Mailgun-Variables": JSON.stringify({
          title,
          details
        }),
    };
    mg.messages().send(data, function (error, body) {
        if (error) {
            console.log(error)
        }
    });
    req.flash("success", i18n.__("successSupport"))
    res.redirect("/support")
}

export const renderSupportForm = (req, res, next) => {
  i18n.setLocale(req.language);
  res.render("support", {
    header: `${i18n.__("supportSectionHeader")} | Congregation Planner`
  })
}

export const renderPrivacyPolicy = (req, res, next) => {
    i18n.setLocale(req.language);
    res.render(`policy_${req.language === "pl" ? "pl": "en"}`, {
        header: `${i18n.__("policyLabel")} | Congregation Planner`
    });
}



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
                        if(user.username === 'Mobile application testing' || user.username === "London Test") {
                            return  res.send({ message: `${i18n.__("successfulLogInWithCode")} ${verificationCode}`, userID: user._id})
                        }
                        res.send({ message: i18n.__("successfulLogIn"), userID: user._id})
                    })
                    .catch((err) => res.send(err))
            });
        } else {
            res.send("Zweryfikuj konto jeszcze raz")
        }
      
    })(req, res, next);
}

export const logOutCongregation = (req, res, next) => {
    req.logout();
    res.send("Poprawnie wylogowano");
}

export const registerDevice = async (req, res, next) => {
    if(req.body.preacherId) {
      console.log(req.body)
      await addPushToken(req.body.preacherId.replaceAll('"', ''), req.body.token);
      res.json("Successfully added device to send notifications")
    }
    return null;
}

export const askAccess = async (req, res, next) => {
  const emailTitle = `Właśnie pojawiła się nowa prośba o dostęp w Congregation Planner. Oto szczegóły: `;
  const details = `Imię i nazwisko: <strong>${req.body.name}</strong> <br> Nazwa zboru: <strong>${req.body.congName}</strong> <br> Email kontaktowy: <strong>${req.body.contactEmail}</strong>`
  await sendNotificationEmail("congregationplanner33@gmail.com", emailTitle, details);
  res.json("done")
}

export const shareIdea = async (req, res, next) => {
  const emailTitle = `Właśnie ktoś podzielił się sugestią ulepszenia czegoś w Congregation Planner. Oto szczegóły: `;
  const details = `Imię i nazwisko: <strong>${req.body.name}</strong> <br> Krótki opis: <strong>${req.body.shortDescription}</strong> <br> Dłuższy opis: <strong>${req.body.detailedDescription}</strong> <br> Email kontaktowy: <strong>${req.body.contactEmail}</strong>`
  await sendNotificationEmail("congregationplanner33@gmail.com", emailTitle, details);
  res.json("done")
}

export const raiseIssue = async (req, res, next) => {
  const emailTitle = `Właśnie ktoś zgłosił błąd w Congregation Planner. Oto szczegóły: `;
  const details = `Imię i nazwisko: <strong>${req.body.name}</strong> <br> Krótki opis: <strong>${req.body.shortDescription}</strong> <br> Dłuższy opis: <strong>${req.body.detailedDescription}</strong> <br> Email kontaktowy: <strong>${req.body.contactEmail}</strong>`
  await sendNotificationEmail("congregationplanner33@gmail.com", emailTitle, details);
  res.json("done")
}

export const helpInTranslation = async (req, res, next) => {
  const emailTitle = `Właśnie ktoś zgłosił chęć przetłumaczenia Congregation Planner na inny język. Oto szczegóły: `;
  const details = `Imię i nazwisko: <strong>${req.body.name}</strong> <br> Język podstawowy: <strong>${req.body.primaryLanguage}</strong> <br> Język tłumaczenia: <strong>${req.body.toLanguage}</strong> <br> Email kontaktowy: <strong>${req.body.contactEmail}</strong>`
  await sendNotificationEmail("congregationplanner33@gmail.com", emailTitle, details);
  res.json("done")
}
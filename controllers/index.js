import express from "express";
import flash from "connect-flash";
import passport from "passport";
import methodOverride from "method-override";
import { sendEmail, encrypt, sendNotificationEmail } from "../helpers.js";
import Activity from "../models/activity.js";
import ipWare from "ipware";
import i18n from "i18n";
import { addPushToken } from "../notifications.js";
import congregation from "../models/congregation.js";
import cartsHour from "../models/cartsHour.js";
import meeting from "../models/meeting.js";
import meetingAssignment from "../models/meetingAssignment.js";
import mailgun from 'mailgun-js';

const app = express();
const getIP = ipWare().get_ip;

app.use(flash());
app.use(methodOverride("_method"));


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
        to: "maciejkuta6@gmail.com",
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
                        if(user.username === "Testy aplikacji mobilnej") {
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
  await sendNotificationEmail("maciejkuta6@gmail.com", emailTitle, details);
  res.json("done")
}

export const shareIdea = async (req, res, next) => {
  const emailTitle = `Właśnie ktoś podzielił się sugestią ulepszenia czegoś w Congregation Planner. Oto szczegóły: `;
  const details = `Imię i nazwisko: <strong>${req.body.name}</strong> <br> Krótki opis: <strong>${req.body.shortDescription}</strong> <br> Dłuższy opis: <strong>${req.body.detailedDescription}</strong> <br> Email kontaktowy: <strong>${req.body.contactEmail}</strong>`
  await sendNotificationEmail("maciejkuta6@gmail.com", emailTitle, details);
  res.json("done")
}

export const raiseIssue = async (req, res, next) => {
  const emailTitle = `Właśnie ktoś zgłosił błąd w Congregation Planner. Oto szczegóły: `;
  const details = `Imię i nazwisko: <strong>${req.body.name}</strong> <br> Krótki opis: <strong>${req.body.shortDescription}</strong> <br> Dłuższy opis: <strong>${req.body.detailedDescription}</strong> <br> Email kontaktowy: <strong>${req.body.contactEmail}</strong>`
  await sendNotificationEmail("maciejkuta6@gmail.com", emailTitle, details);
  res.json("done")
}

export const helpInTranslation = async (req, res, next) => {
  const emailTitle = `Właśnie ktoś zgłosił chęć przetłumaczenia Congregation Planner na inny język. Oto szczegóły: `;
  const details = `Imię i nazwisko: <strong>${req.body.name}</strong> <br> Język podstawowy: <strong>${req.body.primaryLanguage}</strong> <br> Język tłumaczenia: <strong>${req.body.toLanguage}</strong> <br> Email kontaktowy: <strong>${req.body.contactEmail}</strong>`
  await sendNotificationEmail("maciejkuta6@gmail.com", emailTitle, details);
  res.json("done")
}

export const encryptAllData = async (req, res, next) => {
  congregation
    .find({})
    .exec()
    .then((congregations) => {
      congregations.forEach((congregation) => {
        congregation.territoryServantEmail =
          congregation.territoryServantEmail &&
          encrypt(congregation.territoryServantEmail);
        congregation.ministryOverseerEmail =
          congregation.ministryOverseerEmail &&
          encrypt(congregation.ministryOverseerEmail);
        congregation.save();
      });

      cartsHour
        .find({})
        .exec()
        .then((cartHours) => {
          cartHours.forEach((cartHour) => {
            cartHour.otherPreacher1 =
              cartHour.otherPreacher1 && encrypt(cartHour.otherPreacher1);
            cartHour.otherPreacher2 =
              cartHour.otherPreacher2 && encrypt(cartHour.otherPreacher2);
            cartHour.save();
          });
          meeting
            .find({})
            .exec()
            .then((meetings) => {
              meetings.forEach((meeting) => {
                meeting.otherEndPrayer =
                  meeting.otherEndPrayer && encrypt(meeting.otherEndPrayer);
                meeting.save();
              });
              meetingAssignment
                .find({})
                .exec()
                .then((meetingAssignments) => {
                  meetingAssignments.forEach((meetingAssignment) => {
                    meetingAssignment.otherParticipant =
                      meetingAssignment.otherParticipant &&
                      encrypt(meetingAssignment.otherParticipant);
                    meetingAssignment.save();
                  });
                  res.json("done");
                })
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
    })

    .catch((err) => console.log(err));
};

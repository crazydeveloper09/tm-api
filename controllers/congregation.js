import express from "express";
import Congregation from "../models/congregation.js";
import flash from "connect-flash";
import passport from "passport";
import methodOverride from "method-override";
import { sendEmail } from "../helpers.js";

const app = express();

app.use(flash());
app.use(methodOverride("_method"));

export const renderRegisterCongregationForm = (req, res, next) => {
    if(req.query.code === process.env.REGISTER_CODE){
        res.render("./congregations/new", {
            header: "Rejestracja zboru | Territory Manager",
            congregation: ''
        });
    }
	
}

export const registerCongregation = (req, res, next) => {
    if(req.body.password !== req.body.confirm){
        req.flash("error", "Hasła nie są te same");
        res.render("./congregations/new", { error:  "Hasła nie są te same", congregation: req.body, header: "Rejestracja zboru | Territory Manager"});
    } else {
        let verificationCode = '';
        for (let i = 0; i <= 5; i++) {
            let number = Math.floor(Math.random() * 10);
            let numberString = number.toString();
            verificationCode += numberString;
        }
        let newUser = new Congregation({
            username: req.body.username,
            territoryServantEmail: req.body.territoryServantEmail,
            ministryOverseerEmail: req.body.ministryOverseerEmail,
            verificationNumber: verificationCode,
            verificationExpires: Date.now() + 360000
        });
        Congregation.register(newUser, req.body.password, function(err, congregation) {
            if(err) {
                
                return res.render("./congregations/new", { error: err.message});
            } 
            passport.authenticate("local")(req, res, function() {
                const subject = 'Weryfikacja maila w Territory Manager';
                const emailText = `<p class="description">
                Witaj <em>${congregation.username}</em>,
                <br>
                Jesteś na ostatniej prostej do możliwości zarządzania terenami w Territory Manager. Wystarczy, że 
                Ty lub nadzorca służby w zborze potwierdzicie email poniższym 
                kodem weryfikacyjnym:
                <br>
                <br>
                <strong>${congregation.verificationNumber}</strong>
                <br>
                <br>
                Wasz brat,
                <br>
                Maciek
                <br>
                <em>Wiadomość wysłana automatycznie, nie odpowiadaj na nią</em>
            </p>`
                sendEmail(subject, congregation.territoryServantEmail, emailText)
                sendEmail(subject, congregation.ministryOverseerEmail, emailText)
                res.redirect(`/congregations/${congregation._id}/verification`);
            });
        });
    }
}

export const renderCongregationInfo = (req, res, next) => {
    Congregation
        .findById(req.params.congregation_id)
        .populate(["preacher", "territories"])
        .exec()
        .then((congregation) => {
            res.render("./congregations/show", {
                header: `Zbór ${congregation.username} | Territory Manager`,
                congregation: congregation,
                currentUser: req.user,
            })
        })
        .catch((err) =>  console.log(err))
}

export const renderEditCongregationForm = (req, res, next) => {
    Congregation
        .findById(req.params.congregation_id)
        .exec()
        .then((congregation) => {
            res.render("./congregations/edit", { 
                currentUser: req.user, 
                congregation: congregation, 
                header: `Edytuj głosiciela w zborze ${req.user.username} | Territory Manager`
            });
        })
        .catch((err) => console.log(err));
}

export const editCongregation = (req, res, next) => {
    Congregation
        .findByIdAndUpdate(req.params.congregation_id, req.body.congregation)
        .exec()
        .then((congregation) => res.redirect(`/congregations/${congregation._id}`))
        .catch((err) => console.log(err))
}

export const renderVerificationForm = (req, res, next) => {
    Congregation
        .findOne({
            $and: [
                {_id: req.params.congregation_id},
                {verificationExpires: { $gt: Date.now()}}
            ]
        })
        .exec()
        .then((congregation) => {
            if(congregation){
                let header = "Weryfikacja konta | Territory Manager"
                res.render("./congregations/verification", {
                    header: header,
                    congregation: congregation
                })
            } else {
                req.flash("error", "Kod weryfikacyjny wygasł lub nie ma takiego konta. Kliknij przycisk Wyślij kod ponownie poniżej ")
                let header = "Weryfikacja konta | Territory Manager"
                res.render("./congregations/verification", {
                    header: header,
                    congregation_id: req.params.congregation_id
                })
            }
        })
        .catch((err) => console.log(err))
}

export const verifyCongregation = (req, res, next) => {
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
                    req.flash("success", `Witaj ${congregation.username}. Bardzo nam miło, że do nas dołączyłeś`)
                    res.redirect("/login")
                } else {
                    req.flash("error", "Kod weryfikacyjny jest niepoprawny. Spróbuj ponownie")
                    res.redirect(`back`)
                }
            } else {
                req.flash("error", "Kod weryfikacyjny wygasł lub nie ma takiego konta. Kliknij przycisk Wyślij kod ponownie poniżej ")
                res.redirect("back")
            }
        })
        .catch((err) => console.log(err))
}

export const resendVerificationCode = (req, res, next) => {
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
            const subject = 'Ponowne wysłanie kodu, by potwierdzić email';
            const emailText = ` <p class="description">
                Witaj <em>${congregation.username}</em>,
                <br>
                Właśnie dostałem prośbę o ponowne wysłanie kodu do
                weryfikacji emaila w Territory Manager.
                Jeśli to nie byłeś ty, zignoruj wiadomość. 
                <br>
                Kod potrzebny do weryfikacji to:
                <br>
                <br>
                <strong>${congregation.verificationNumber}</strong>
                <br>
                <br>
                Wasz brat,
                <br>
                Maciek
                <br>
                <em>Wiadomość wysłana automatycznie, nie odpowiadaj na nią</em>
            </p>`;
            sendEmail(subject, congregation.territoryServantEmail, emailText)
            sendEmail(subject, congregation.ministryOverseerEmail, emailText)
            res.redirect(`/congregations/${congregation._id}/verification`);
        })
        .catch((err) => console.log(err))
}

export const renderTwoFactorForm = (req, res, next) => {
    Congregation
        .findOne({
            $and: [
                {_id: req.params.congregation_id},
                {verificationExpires: { $gt: Date.now()}}
            ]
        })
        .exec()
        .then((congregation) => {
            if(congregation){
                let header = "Dwustopniowa weryfikacja | Territory Manager"
                res.render("./congregations/two-factor", {
                    header: header,
                    congregation: congregation
                })
            } else {
                req.flash("error", "Kod weryfikacyjny wygasł lub nie ma takiego konta. Kliknij przycisk Wyślij kod ponownie poniżej ")
                let header = "Dwustopniowa werfyikacja | Territory Manager"
                res.render("./congregations/two-factor", {
                    header: header,
                    congregation_id: req.params.congregation_id
                })
            }
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
                req.flash("success", `Pomyślnie zalogowałeś się do Territory Manager`)
                res.redirect(`/territories/available`)
            } else {
                req.flash("error", "Kod weryfikacyjny wygasł lub nie ma takiego konta. Kliknij przycisk Wyślij kod ponownie poniżej ")
                res.redirect("back")
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
            let emailText = `<p class="description">
            Witaj <em>${congregation.username}</em>,
            <br>
            Właśnie dostałem prośbę o ponowne wysłanie kodu do
            dwustopniowej weryfikacji logowania do Territory Manager.
            Jeśli to nie byłeś ty, zignoruj wiadomość. 
            <br>
            Kod potrzebny do weryfikacji to:
            <br>
            <br>
            <strong>${congregation.verificationNumber}</strong>
            <br>
            <br>
            Wasz brat,
            <br>
            Maciek
            <br>
            <em>Wiadomość wysłana automatycznie, nie odpowiadaj na nią</em>
            </p>`;
            
            sendEmail(subject, congregation.territoryServantEmail, emailText)
            sendEmail(subject, congregation.ministryOverseerEmail, emailText)
            res.redirect(`/congregations/${congregation._id}/two-factor`);
        })
        .catch((err) => console.log(err))
}
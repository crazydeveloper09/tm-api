import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import expressSession from 'express-session';
import indexRoutes from "./routes/index.js";
import preachersRoutes from "./routes/preacher.js";
import territoriesRoutes from "./routes/territory.js";
import congregationsRoutes from "./routes/congregation.js";
import ministryGroupsRoutes from "./routes/ministryGroup.js";
import Congregation from "./models/congregation.js";
import Preacher from "./models/preacher.js";
import LocalStrategy from "passport-local";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import flash from "connect-flash";
import dotenv from "dotenv";
import methodOverride from "method-override";
import path from 'path';
import helmet from "helmet";
import { fileURLToPath } from 'url';
import ministryMeetingRoutes from "./routes/ministryMeeting.js";
import cartsScheduleRoutes from './routes/cartsSchedule.js';
import meetingRoutes from './routes/meeting.js';
import meetingAssignmentRoutes from './routes/meetingAssignment.js';
import audioVideoRoutes from './routes/audioVideo.js';
import ordinalRoutes from './routes/ordinal.js';
import cors from 'cors';
import i18n from "i18n";

const __filename = fileURLToPath(import.meta.url);

export const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(helmet({
    contentSecurityPolicy: false
}))
app.use(cors())
dotenv.config();

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true})

i18n.configure({
    locales: ["en", "pl"],
   	register: global,
	defaultLocale: 'en',
    directory: __dirname + '/locales',
})

app.use(i18n.init);
app.use(expressSession({
    secret: "heheszki",
    resave: true,
    saveUninitialized: true
}));
app.use(function(req, res, next) {
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.currentUser = req.user;
    next();
});
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Congregation.authenticate()));
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
}

passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
    if(payload.userId) {
        Congregation.findById(payload.userId, (err, user) => {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
        
            }
        })
    } else {
        Preacher.findById(payload.preacher, (err, user) => {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
        
            }
        })
    }
    
}))


app.use("/preachers", preachersRoutes);
app.use("/territories", territoriesRoutes);
app.use("/congregations", congregationsRoutes)
app.use("/congregations/:congregation_id/ministryGroups", ministryGroupsRoutes);
app.use("/ministryMeetings", ministryMeetingRoutes)
app.use("/meetings", meetingRoutes)
app.use("/meetings/:meeting_id/assignments", meetingAssignmentRoutes)
app.use("/meetings/:meeting_id/audioVideo", audioVideoRoutes)
app.use("/meetings/:meeting_id/attendants", ordinalRoutes)
app.use("/cartsSchedule", cartsScheduleRoutes)
app.use(indexRoutes);

app.listen(process.env.PORT);
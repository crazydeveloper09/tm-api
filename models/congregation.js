import mongoose from"mongoose";
import passportLocalMongoose from"passport-local-mongoose";
import { decrypt, encrypt } from "../helpers.js";

const congregationSchema = new mongoose.Schema({
    username: String,
    password: String,
    territoryServantEmail: {
        type: String,
        set: (email) => encrypt(email),
        get: (encryptedEmail) => decrypt(encryptedEmail),
    },
    ministryOverseerEmail: {
        type: String,
        set: (email) => encrypt(email),
        get: (encryptedEmail) => decrypt(encryptedEmail),
    },
    territoryServantEmailHash: String,
    ministryOverseerEmailHash: String,
    verificationNumber: Number,
    verificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verificated: {
        type: Boolean,
        default: false
    },
    territories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Territory"
        }
    ],
    preachers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Preacher"
        }
    ],
    mainCity: String,
    mainCityLatitude: Number,
    mainCityLongitude: Number,
})
congregationSchema.plugin(passportLocalMongoose);
congregationSchema.set("toJSON", { getters: true })
export default mongoose.model("Congregation", congregationSchema);
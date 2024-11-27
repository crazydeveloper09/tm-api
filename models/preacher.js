import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2';
import passportLocalMongoose from"passport-local-mongoose";
import { decrypt, encrypt } from "../helpers.js";

const preacherSchema = new mongoose.Schema({
    name: {
        type: String,
        set: (name) => encrypt(name),
        get: (encryptedName) => decrypt(encryptedName),
    },
    congregation: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Congregation"
    },
    link: {
        type: String,
        set: (link) => encrypt(link),
        get: (encryptedLink) => decrypt(encryptedLink),
    },
    roles: Array
});
preacherSchema.plugin(passportLocalMongoose);
preacherSchema.plugin(mongoosePaginate)
preacherSchema.set("toJSON", { getters: true })

export default mongoose.model("Preacher", preacherSchema);
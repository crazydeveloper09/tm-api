import mongoose from "mongoose";
import { decrypt, encrypt } from "../helpers.js";

const cartsHourSchema = new mongoose.Schema({
    timeDescription: String,
    preacher1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher",
    },
    preacher2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
    otherPreacher1: {
        type: String,
        set: (otherPreacher1) => encrypt(otherPreacher1),
        get: (encryptedOtherPreacher1) => decrypt(encryptedOtherPreacher1),
    },
    otherPreacher2: {
        type: String,
        set: (otherPreacher2) => encrypt(otherPreacher2),
        get: (encryptedOtherPreacher2) => decrypt(encryptedOtherPreacher2),
    },
    congregation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Congreagtion"
    },
    cartDay: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CartDay"
    }
})

cartsHourSchema.set("toJSON", { getters: true })

export default mongoose.model("CartHour", cartsHourSchema)
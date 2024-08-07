import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    ipAddress: String,
    platform: String,
    userAgent: String,
    applicationType: String,
    date: {
        type: Date,
        default: Date.now()
    },
    congregation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Congregation'
    },
    appName: {
        type: String,
        default: "Territory Manager"
    }
})

export default mongoose.model('Activity', activitySchema)
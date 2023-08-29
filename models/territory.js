import mongoose from "mongoose";

const territorySchema = new mongoose.Schema({
    city: String,
    street: String,
    lastWorked: String,
    number: Number,
    beginNumber: Number,
    endNumber: Number,
    kind: String,
    preacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
    congregation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Congregation"
    },
    history: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Checkout"
    }],
    type: String,
    taken: String,
    description: String,
    isPhysicalCard: {
        type: Boolean,
        default: true
    },
    longitude: Number,
    latitude: Number,
    location: String,
});

export default mongoose.model("Territory", territorySchema);
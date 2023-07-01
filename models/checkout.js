import mongoose from "mongoose";

const checkoutSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now()
    },
    record: Object,
    preacher:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Preacher"
    },
})

export default mongoose.model("Checkout", checkoutSchema)
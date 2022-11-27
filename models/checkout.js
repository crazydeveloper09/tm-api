import mongoose from "mongoose";

const checkoutSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now()
    },
    record: Object
})

export default mongoose.model("Checkout", checkoutSchema)
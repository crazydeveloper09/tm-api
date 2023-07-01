import mongoose from "mongoose";

const preacherSchema = new mongoose.Schema({
    name: String,
    congregation: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Congregation"
    }
});

export default mongoose.model("Preacher", preacherSchema);
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HostSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please use a valid email address']
    },
    password: { type: String },
});

// Export model
module.exports = mongoose.model("Host", HostSchema);

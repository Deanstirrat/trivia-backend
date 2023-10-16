const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//answers are saved in case the host fails to recieve them

const TeamSchema = new Schema({
    teamName: { type: String },
    game: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
    },
    answers: {
        type: [{
            round: { type: Number },
            answers: [{ type: String }]
        }],
        default: []
    }
});

// Export model
module.exports = mongoose.model("Team", TeamSchema);

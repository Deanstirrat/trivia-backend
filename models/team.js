const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//answers are saved in case the host fails to recieve them

const TeamSchema = new Schema({
    teamName: { type: String },
    rounds: {
        type: [{
            round: { type: Number },
            answers: [{
                answer: { type: String },
                isCorrect: { type: Boolean }
            }] 
        }],
        default: []
    }
});

// Export model
module.exports = mongoose.model("Team", TeamSchema);

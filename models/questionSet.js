const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    id: Number,
    question: String,
    answer: String
}, {_id: false});

const RoundSchema = new Schema({
    id: Number,
    questions: [QuestionSchema]
}, {_id: false});

const QuestionSetSchema = new Schema({
    rounds: [RoundSchema]
});

module.exports = mongoose.model('QuestionSet', QuestionSetSchema);
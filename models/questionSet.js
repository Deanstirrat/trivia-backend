const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    question: String,
    answer: String
}, {_id: false});

const RoundSchema = new Schema({
    questions: [QuestionSchema]
}, {_id: false});

const QuestionSetSchema = new Schema({
    rounds: [RoundSchema]
});

module.exports = mongoose.model('QuestionSet', QuestionSetSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuizSchema = new Schema({
  name: String,
  theme: String,
  questionSet: { type: Schema.Types.ObjectId, ref: 'QuestionSet' }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);

const Quiz = require('../models/quiz');

//Host get
exports.quiz_get = async (req, res, next) => {
  try {
    const quizes = await Quiz.find();
    res.json(quizes);
  } catch (error) {
    next(error);
  }  
}
var express = require('express');
var router = express.Router();
const host_controller = require('../controllers/hostController');
const quiz_controller = require('../controllers/quizController');

//get quizes
router.get('/quizzes', quiz_controller.quiz_get);

// get games related to host
router.get('/:id', host_controller.host_get);

module.exports = router;
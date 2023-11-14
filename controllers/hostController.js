const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const passport = require('passport');
const jwt = require('jsonwebtoken');
//models
const Host = require('../models/host');
const Game = require('../models/game');
const QuestionSet = require('../models/questionSet');

// Host login
exports.host_login_post = [
    //form validation/santization
    body("username")
        .trim()
        .isLength({ min: 1 })
        .withMessage('username must not be blank')
        .escape(),
    body("password")
        .trim()
        .isLength({ min: 1 })
        .withMessage('password must not be blank')
        .escape(),
  
  
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()){
        res.status(401).send('Invalid username or password');
        return;
      }
      
      passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          res.status(401).json({ message: info.message });
          return;
        }
      
        // Generate a JWT token
        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
      
        console.log("login success");

        res.json({ token });
      
      })(req, res, next);
      
    },
  ];

//Host get
exports.host_get = async (req, res, next) => {
  try {
    const games = await Game.find({ 'host.hostId': req.params.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'quiz',
      populate: {
        path: 'questionSet',
      },
    })
    .populate('teams.team');
    res.json(games);
  } catch (error) {
    console.log(error);
    next(error);
  }  
}
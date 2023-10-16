const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const Host = require('../models/host');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
      if (!errors.isEmpty()) res.status(401).send('Invalid username or password');
      
      passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message });
        }
      
        // Generate a JWT token
        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });
      
        console.log("login success");

        res.json({ token });
      
      })(req, res, next);
      
    },
  ];
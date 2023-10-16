const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Quiz = require("../models/quiz");
//model
const Game = require('../models/game');

//POST create game
exports.game_create_post = [
    body("quiz")
    .trim()
    .escape(),

    async (req, res) => {
        try {
            //create new game
            let { quiz } = req.body;

             // If no quiz is provided, fetch the most recently created quiz
             if (!quiz) {
                const recentQuiz = await Quiz.findOne().sort({ createdAt: -1 });
                if (recentQuiz) {
                    quiz = recentQuiz._id;
                } else {
                    return res.status(400).send('No quiz available');
                }
            } else if (!ObjectId.isValid(quiz)) {
                // If quiz is provided, check if it's a valid ObjectId
                return res.status(400).send('Invalid quiz id');
            }

            //create game and save
            const game = new Game({ quiz, host: new ObjectId(req.userId) });
            await game.save();

            res.status(201).send({ message: 'Game created successfully', gameId: game._id });
    
        } catch (error) {
            console.log(error);
            res.status(500).send('Error creating game');
        }
    },
]
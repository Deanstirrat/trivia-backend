const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
//model
const Game = require('../models/game');
const Quiz = require("../models/quiz");

//code to generate a join code
const generateJoinCode = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let joinCode = '';
    for (let i = 0; i < 5; i++) {
      joinCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return joinCode;
  };

//POST create game
exports.game_create_post = [
    body("quiz")
    .trim()
    .escape(),

    async (req, res) => {
        try {
            //create new game
            let { quiz, host, socketId } = req.body;

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

            // Generate unique join code
            let joinCode = generateJoinCode();
            let gameWithJoinCode = await Game.findOne({ joinCode });
            while (gameWithJoinCode) {
                joinCode = generateJoinCode();
                gameWithJoinCode = await Game.findOne({ joinCode });
            }

            //create game and save
            const game = new Game({ quiz, host:{hostId: host, socketId: socketId}, joinCode});
            await game.save();

            res.status(201).send({ message: 'Game created successfully', joinCode: game.joinCode });
    
        } catch (error) {
            console.log(error);
            res.status(500).send('Error creating game');
        }
    },
]

//GET get game
exports.game_get = async (req, res, next) => {
    try {
        const gameId = req.params.id;
    
        // Find the game by ID
        const game = await Game.findById(gameId)
        .populate({
            path: 'quiz',
            populate: {
                path: 'questionSet'
            }
        })
        .populate('teams.team');
    
        if (!game) {
          return res.status(404).send('Game not found');
        }
    
        res.status(200).send(game); // Return the game to the client
      } catch (error) {
        console.log(error);
        res.status(500).send('Error retrieving game');
      }
  }
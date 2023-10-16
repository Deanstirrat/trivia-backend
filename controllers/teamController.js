const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
//model
const Team = require('../models/team');
const Game = require('../models/team');
const { ObjectId } = require('mongodb');

//POST create game
exports.team_create_post = [
    body("teamName")
    .trim()
    .escape(),

    async (req, res) => {
        try {
            //create new game
            const { teamName } = req.body;
            const gameId = req.params.gameId;

            // Check if team with the same name exists in the game
            const existingTeam = await Team.findOne({ teamName, game: new ObjectId(gameId) });

            if (existingTeam) {
                return res.status(400).send('Team with this name already exists in the game');
            }

            const team = new Team({teamName, game: new ObjectId(gameId)});
            await team.save();

            // Add team to game's teams and scoreboard arrays
            await Game.findOneAndUpdate(
                { _id: new ObjectId(gameId) },
                { $push: { teams: team._id, scoreboard: { team: team._id, score: 0 } } },
                { new: true }
            );

            res.status(201).send('Team created successfully');
    
        } catch (error) {
            console.log(error);
            res.status(500).send('Error creating team');
        }
    },
]
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const mongoose = require('mongoose');
const io = require('../io');
//model
const Team = require('../models/team');
const Game = require('../models/game');
const { ObjectId } = require('mongodb');

//POST create team in game
exports.team_create_post = [
    body("teamName")
    .trim()
    .escape(),

    async (req, res) => {
        try {
            const { teamName, socketId } = req.body;
            const joinCode = req.params.id;

            //check if game exists
            const game = await Game.findOne({ joinCode: joinCode });
            if(!game){
                res.status(404).send('game does not exist');
                return;
            }
            //check if team name already exists in game
            const teamExists = game.teams.some(team => team.team.teamName === teamName);
            if(teamExists){
                res.status(409).send('team already exists');
                return;
            }
            //create team
            const team = new Team({teamName});
            await team.save();

            // Add team to game's teams, scoreboard and socket arrays
            const updatedGame = await Game.findOneAndUpdate(
                { joinCode: joinCode },
                { $push: { teams: { team: team._id, score: 0, socketId: socketId } } },
                { new: true }
            )
            .populate({
                path: 'quiz',
                populate: {
                    path: 'questionSet'
                }
            })
            .populate('teams.team');

            //tell host that team joined
            io.to(game.host.socketId).emit('teamJoined', updatedGame._id);

            res.status(201).send({teamId: team._id, gameData: updatedGame});
    
        } catch (error) {
            console.log(error);
            res.status(500).send('Error creating team');
        }
    },
]
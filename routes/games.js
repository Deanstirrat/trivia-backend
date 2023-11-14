var express = require('express');
var router = express.Router();
const game_controller = require('../controllers/gameController');
const team_controller = require('../controllers/teamController');

// Create a new game
router.post('/new', game_controller.game_create_post);

// Get a game
router.get('/:id', game_controller.game_get);

// create a team
router.post('/:id', team_controller.team_create_post);

module.exports = router;


// //create a team
// router.post('/:id', team_controller.team_create_post);
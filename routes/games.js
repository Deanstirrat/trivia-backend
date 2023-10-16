var express = require('express');
var router = express.Router();
const game_controller = require('../controllers/gameController')
const team_controller = require('../controllers/teamController');

// create game
router.post('/create', game_controller.game_create_post);

//create a team
router.post('/:id', team_controller.team_create_post);

module.exports = router;
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  teams: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    }],
  default: []
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host'
  },
  scoreboard: {
  type: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    score: {
      type: Number,
      default: 0
    }
  }],
  default: []
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  currentRound: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Game', GameSchema);
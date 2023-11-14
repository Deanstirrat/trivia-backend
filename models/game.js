const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  joinCode: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 5,
    match: /^[a-z0-9]{5}$/ // Regex pattern to enforce lowercase letters and numbers
  },
  host: {
    type: {
      hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host'
      },
      socketId: { type: String },
    },
  },
  teams: {
  type: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    score: {
      type: Number,
      default: 0
    },
    socketId: {
      type: String
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
    default: -1
  },
  currentQuestion: {
    type: Number,
    default: -1
  },
  script: {
    type: {},
    default: null
  }
},{ timestamps: true });

module.exports = mongoose.model('Game', GameSchema);
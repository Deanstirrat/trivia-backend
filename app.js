var createError = require('http-errors');
var express = require('express');
var path = require('path');
const cors = require('cors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config()
//db
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
//auth
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
require('./utils/authenticateToken');
//routers
const indexRouter = require('./routes/index');
const hostsRouter = require('./routes/hosts');
const usersRouter = require('./routes/users');
const gamesRouter = require('./routes/games');
//models
const Host = require('./models/host');
const Game = require('./models/game');
const Team = require('./models/team');
//scriptwriter
const writeScript = require('./utils/scriptWriter');

var app = express();
//socket.io
var io = require('./io');

//socket listeners
io.on('connection', (socket) => {
  console.log('A client connected');

  //handle host socketId change
  socket.on('updateHostSocketId', async ({ socketId, hostId }) => {
    try {
      // Find the last created game and update the host's socketId
      const game = await Game.findOneAndUpdate(
        { 'host.hostId': hostId },
        { $set: { 'host.socketId': socketId } },
        { new: true, sort: { createdAt: -1 } }
      )
      .populate({
        path: 'quiz',
        populate: {
          path: 'questionSet',
        },
      })
      .populate('teams.team');;

      if (!game) {
        console.log(`No game found for host ${hostId}`);
        return;
      }

      console.log('sending game with updated host socket');

      // Emit the updated socketId to all teams in the game
      game.teams.forEach((team) => {
        io.to(team.socketId).emit('updateGameData', { updatedGame: game });
      });
      //send host latest game data
      io.to(socketId).emit('updateGameData', {updatedGame: game});


      console.log(`Host ${hostId} updated socketId to ${socketId}`);
    } catch (error) {
      console.log(error);
    }
  });

  //handle team socketId update
  socket.on('updateTeamSocketId', async ({ socketId, teamId }) => {
    console.log('update team socket');
    try {

      // Update the team's socketId in the game
      const game =  await Game.findOneAndUpdate(
        { 'teams.team': new mongoose.Types.ObjectId(teamId) },
        { $set: { 'teams.$.socketId': socketId } },
        { new: true, sort: { createdAt: -1 } }
      )
      .populate({
        path: 'quiz',
        populate: {
          path: 'questionSet',
        },
      })
      .populate('teams.team');

      //update host and client game data
      io.to(socketId).emit('updateGameData', {updatedGame: game});
      io.to(game.host.socketId).emit('updateGameData', {updatedGame: game});

      console.log(`Team ${teamId} updated socketId to ${socketId}`);
    } catch (error) {
      console.log(error);
    }
  });

  //handle team request data
  socket.on('requestGameData', async ({ teamId }) => {
    try {
      
      // get game for hostId
      const game = await Game.findOne({ 'teams.teamId': teamId });

      // Emit a message to the host's socket with the team's Id
      io.to(game.host.socketId).emit('requestGameData', { teamId });

      console.log(`Team ${teamId} requested data from ${game.host.socketId}`);
    } catch (error) {
      console.log(error);
    }
  });

  //handle disconnect
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });

  //handle update team clientS with new data
  socket.on('updateTeamClients', ({updatedGame}) => {
    console.log('send game update to all teams')
    updatedGame.teams.forEach((team) => {
      io.to(team.socketId).emit('updateGameData', {updatedGame});
    });
  });

  //handle update a team client with new data
  socket.on('updateTeamClient', ({gameData, teamSocket}) => {
    console.log('update a client')
    io.to(teamSocket).emit('updateGameData', {gameData});
    console.log('sent game update to ' + teamSocket);
  });

  //handle round change
  socket.on('incrementRound', async ({gameData}) => {
    //update db
    try {
      if(gameData.currentRound==0){
        //first round. no need to score last round
        const updatedGame = await Game.findOneAndUpdate(
          { _id: gameData._id },
          { $set: { currentRound: gameData.currentRound, currentQuestion: -1} },
          { sort: { createdAt: -1 } }
        );
        //send update to teams
        gameData.teams.forEach((team) => {
          io.to(team.socketId).emit('updateGameData', {updatedGame: gameData});
        });
      } else {
        //increment round and score previous round
        gameData.teams.forEach((team) => {
          const round = team.team.rounds.find((round) => round.round === gameData.currentRound-1);
          if (round) {
            round.answers.forEach((answer) => {
              if (answer.isCorrect) {
                team.score += 1;
              }
            });
          }
        });
        //update db with scores/round
        const updatedGame = await Game.findOneAndUpdate(
          { _id: gameData._id },
          { $set: { teams: gameData.teams, currentRound: gameData.currentRound, currentQuestion: -1 } },
          { sort: { createdAt: -1 } }
        );
        //send update to teams and host
        updatedGame.teams.forEach((team) => {
          io.to(team.socketId).emit('updateGameData', {updatedGame: gameData});
        });
        io.to(updatedGame.host.socketId).emit('updateGameData', {updatedGame: gameData});
      }
      console.log('incremented round');
    } catch (error) {
      console.log(error);
    }
  });

  //handle question change
  socket.on('incrementQuestion', async ({gameData}) => {
    //update db
    try {
      //first round. no need to score last round
      const updatedGame = await Game.findOneAndUpdate(
        { _id: gameData._id },
        { $set: { currentQuestion: gameData.currentQuestion } },
        { sort: { createdAt: -1 } }
      );
      //send update to teams
      updatedGame.teams.forEach((team) => {
        io.to(team.socketId).emit('updateGameData', {updatedGame: gameData});
      });
      console.log('incremented question');
    } catch (error) {
      console.log(error);
    }
  });

  //handle team submit answer
  socket.on('submitAnswers', async ({ answers, teamId, roundNumber, hostSocket, sourceAnswers}) => {
    try {
      
      const team = await Team.findById(teamId);

      if(!team){
        console.log('team not foud');
      }


      const answerObjects = answers.map((userAnswer, index) => {
        const sourceAnswer = sourceAnswers[index].answer;
        const isCorrect = String(userAnswer).toLowerCase().trim() == String(sourceAnswer).toLowerCase().trim();
        return {
          answer: userAnswer,
          isCorrect: isCorrect
        };
      });

      // Find the index of the existing round object with round === roundNumber
      const existingRoundIndex = team.rounds.findIndex((round) => round.round === roundNumber);

      // If the index is found, replace the round object
      if (existingRoundIndex !== -1) {
        team.rounds[existingRoundIndex] = { round: roundNumber, answers: answerObjects };
      } else {
        // If the index is not found, push a new round object to the rounds array
        team.rounds.push({ round: roundNumber, answers: answerObjects });
      }

      // Save the updated team in the database
      await team.save();

      console.log(`Answers saved for Team ${teamId}`);

      // Find the game by teamId
      const updatedGame = await Game.findOne({ 'teams.team': new mongoose.Types.ObjectId(teamId)  })
        .populate('teams.team')
        .populate({
          path: 'quiz',
          populate: {
            path: 'questionSet',
          },
      });

      const clientSocket = updatedGame.teams.find((team) => team.team._id.toString() === teamId).socketId;

      //send update to host
      io.to(hostSocket).emit('updateGameData', { updatedGame: updatedGame });
      io.to(clientSocket).emit('updateGameData', { updatedGame: updatedGame });
      console.log('sent updates to host+clients')

    } catch (error) {
      console.log(error);
    }
  });

  //handle score correction
  socket.on('correctScore', async ({teamId, roundNumber, answers}) => {
    try {
      const team = await Team.findOneAndUpdate(
        { _id: teamId, "rounds.round": roundNumber },
        { $set: { "rounds.$.answers": answers } },
        { new: true }
      );
      console.log('updated scoring');
      // Handle the updated team object
    } catch (error) {
      console.log(error);
    }
  })

  //handle script generation request
  socket.on('generateScript', async ({gameId}) => {
    console.log('generate script')
    try{
      const game = await Game.findById(gameId)
      .populate({
        path: 'quiz',
        populate: {
          path: 'questionSet',
        },
      })
      .populate('host.hostId');

      if(game.script) return;

      const rounds = game.quiz.questionSet.rounds.map((round) => {
        const questions = round.questions.map((question) => {
          return { question: question.question };
        });
        return { questions };
      });

      //TODO: Add location, date, and other info here
      //temp values
      const location = 'Volta on pine, Apt. 829, Long Beach California';
      const date = 'Thursday November 9, 2023';
      
      const quizInfo = {
        hostName: game.host.hostId.firstName,
        location: location,
        date: date,
        currentRound: 0,
        totalRounds: game.quiz.questionSet.rounds.length,
      }


      const script = await writeScript.writeScript({quizInfo: quizInfo, rounds: rounds})

      console.log('script generated');

      const updatedGame = await Game.findByIdAndUpdate(gameId, { $set: { script } }, { new: true })
      .populate({
        path: 'quiz',
        populate: {
          path: 'questionSet',
        },
      })
      .populate('teams.team');;

      io.to(updatedGame.host.socketId).emit('updateGameData', {updatedGame});


    } catch (error) {
      console.log(error)
    }

  })

});

// Enable CORS for all routes
app.use(cors());

//authentication 
// Passport Local Strategy Configuration
passport.use('local', new LocalStrategy(
  async (username, password, done) => {
    try {
      // Find a user with the provided email
      const user = await Host.findOne({ username });

      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Compare the provided password with the stored hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // If authentication is successful, return the user object
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Set up mongoose connection
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGO_URI;
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//protected routes (hosts only)
app.use('/hosts', authenticateToken);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/hosts', hostsRouter);
app.use('/games', gamesRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;

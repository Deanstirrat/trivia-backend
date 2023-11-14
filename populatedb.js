const mongoose = require('mongoose');
const Host = require('./models/host');
const Quiz = require('./models/quiz');
const QuestionSet = require('./models/questionSet');
require('dotenv').config()
const bcrypt = require('bcrypt');
const axios = require('axios');
const he = require('he');

//get and decode session token from api
async function retrieveSessionToken() {
    try {
        const response = await axios.get('https://opentdb.com/api_token.php?command=request');
        const sessionToken = response.data.token;
        return sessionToken;
    } catch (error) {
        console.log('Error retrieving session token:', error);
        throw error;
    }
}

async function getQuestionsFromAPI(numQuestions) {
try {
    const response = await axios.get(`https://api.api-ninjas.com/v1/trivia?limit=${numQuestions}`, {
        headers: {
            'X-Api-Key': process.env.API_NINJA_KEY,
        }
    });
    const questions = response.data;
    return questions;
} catch (error) {
    console.log('Error retrieving questions:', error);
    throw error;
}
}

// Set up mongoose connection
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGO_URI;
main().catch((err) => console.log(err));

async function main() {
    console.log("Debug: About to connect");
    await mongoose.connect(mongoDB);
    console.log("Debug: Should be connected?");
    // await hostCreate();
    await quizCreate();
    console.log("Debug: Closing mongoose");
    mongoose.connection.close();
  }

  async function quizCreate(){
    try {

        const name = 'Nov-13-23';
        const theme = 'random';

        // check if quiz exists
        const existingQuiz = await Quiz.findOne({ name });
        if(existingQuiz){
            console.log('Quiz with this name already exists');
            return;
        }
        
        const rounds = [];

        for (let i = 0; i < 6; i++) {
            // Make a call to the API to get 10 questions
            const apiQuestions = await getQuestionsFromAPI(10);
      
            // Create an array to store the questions for this round
            const roundQuestions = [];
      
            // Extract the question and answer from each question object
            for (const apiQuestion of apiQuestions) {
              const newQuestion = {question: apiQuestion.question, answer: apiQuestion.answer};
      
              // Push the new question object into the roundQuestions array
              roundQuestions.push(newQuestion);
            }
      
            // Create a round object with the questions
            const round = { questions: roundQuestions };
      
            // Push the round object into the rounds array
            rounds.push(round);
        }


        // //create questions
        // const question1 = { id: 1, question: 'What is the capital of France?', answer: 'Paris'};
        // const question2 = { id: 2, question: 'What is Megans middle name?', answer: 'Riley'};
        // const question3 = { id: 3, question: 'What country is mount Everest in?', answer: 'Nepal'};

        // const question4 = { id: 1, question: 'What color is the sky?', answer: 'Blue'};
        // const question5 = { id: 2, question: 'What goes up...?', answer: 'Must Come down'};
        // const question6 = { id: 3, question: 'How long is a presidential term?', answer: '4 years'};

        // // Create a Rounds with the Questions
        // const round1 = { id: 1, questions: [question1, question2, question3] };
        // const round2 = { id: 2, questions: [question4, question5, question6] };

        // Create a QuestionSet with the Round
        const questionSet = new QuestionSet({ rounds: rounds });
        await questionSet.save();

        //create quiz and save
        const quiz = new Quiz({name, theme, questionSet: questionSet._id});
        await quiz.save();

        console.log('Quiz created sucesfully')

    } catch (error) {
        console.log('error creating quiz')
    }
}

  async function hostCreate(){
    try {
        const username='deanstirrat';
        const firstName = 'Daen';
        const lastName = 'Stirrat';
        const email = 'deanstirrat@gmail.com';
        const password = 'elstumpo1';

        //check if email exists
        const existingEmail = await Host.findOne({ email });
        if(existingEmail){
            console.log('Host with this email already exists');
            return;
        }
        //check if username exists
        const existingHost = await Host.findOne({ username });
        if(existingHost){
            console.log('Host with this email already exists');
            return;
        }


        //create new user
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
        const user = new Host({firstName, lastName, username, email, password:hashedPassword});
        await user.save();

        console.log('Host created sucesfully')

    } catch (error) {
        console.log('error creating host')
    }
  }
const mongoose = require('mongoose');
const Host = require('./models/host');
const Quiz = require('./models/quiz');
const QuestionSet = require('./models/questionSet');
require('dotenv').config()
const bcrypt = require('bcrypt');

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
        const name='quiz1';
        const theme = 'halloween';

        //check if quiz exists
        const existingQuiz = await Quiz.findOne({ name });
        if(existingQuiz){
            console.log('Quiz with this name already exists');
            return;
        }

        //create question
        const question = { id: 1, question: 'What is the capital of France?', answer: 'Paris'};

        // Create a Round with the Question
        const round = { id: 1, questions: [question] };

        // Create a QuestionSet with the Round
        const questionSet = new QuestionSet({ rounds: [round] });
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
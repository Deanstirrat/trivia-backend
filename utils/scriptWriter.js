const { OpenAI } = require("openai");
const tiktoken = require("tiktoken");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
  });

async function writeScript({quizInfo, rounds}) {
  encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
  console.log('write script');

  const messages = [
    { role: "system", content: `You are an young cool/hip stand up comic and
    well known tv screen writer. You will be creating a script for the host of a bar
    trivia event. You will be given some info about the event and a list of 
    questions. you will be writing some intros to get people excited and 
    let them know what their in for. This is a 
    21+ event so be casual and don't be afraid to make vulgar jokes/comment if they 
    are in good taste. It is a good idea to start a bit-timid and get more lively as 
    rounds go on and people endulge in drinks. Be funny, be witty, be interesting and make sure people have fun. 
    DO NOT GIVE AWAY THE ANSWERS
    RETURN ONLY THE GIVEN STRUCTURE
    
    you will first recieve quiz general quiz information.
    Return a short and sweet intro paragraph to get the event buzzing` },
    { role: "user", content: JSON.stringify(quizInfo) },
  ];

  const outroMessage = { role: "system", content: `write a short outro for the the trivia night to end the night off on a high note using the following quiz info` };

  const roundMessage = { role: "system", content: `You will now recieve a round of questions. Rewrite each questions to add some spark,
  link questions with transitions and create a flow to the quiz. For each round
    you will return the script in the following structure:
    {
      "roundIntro": "fill round intro here",
      "questions": [
      "fill question script here"
      ],
      "roundOutro": "fill round outro here"
    }` };




  const script = {
    gameIntro: "",
    rounds: [],
    gameOutro: ""
  };


  console.log('write intro')
  //write intro
  const introCompletion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-3.5-turbo",
  });
  script.gameIntro = introCompletion.choices[0].message.content;

  //concat response to messges
  messages.push(introCompletion.choices[0].message);
  messages.push(roundMessage);

  //write rounds
  for (const round of rounds) {
    quizInfo.currentRound = quizInfo.currentRound+1;
    console.log(`write round ${quizInfo.currentRound}`)
    messages.push({ role: "user", content: JSON.stringify(round) })

    let completion;
    let roundScript;
    let success = false;
    while (!success) {
      try {

        // Check if the total tokens are near the limit
        while (await countTokens(messages) > 3500) { // some buffer to avoid hitting the limit
          // Remove the oldest message
          messages.shift();
        }

        completion = await openai.chat.completions.create({
          messages: messages,
          model: "gpt-3.5-turbo",
        });

        // Try to parse the message content
        roundScript = JSON.parse(completion.choices[0].message.content);
        success = true;
      } catch (error) {
        console.error(`Error in round ${quizInfo.currentRound}: ${error.message}`);
        console.log('error request')
        console.log(JSON.stringify(round));
        console.log(completion.choices[0].message.content);
        console.log('Retrying...');
      }
    }



    script.rounds.push(roundScript);
    messages.push(completion.choices[0].message);
    console.log(`round ${quizInfo.currentRound} written`)

    // Function to count the number of tokens in a text string
    async function countTokens(messages) {
      let totalTokens = 0;
      for (const message of messages) {
        const tokens = encoding.encode(message.content);
        totalTokens += tokens.length;
      }
      return totalTokens;
    }
  }

  //get outro
  messages.push(outroMessage);
  console.log('write outro')
  const outroCompletion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-3.5-turbo",
  });
  script.gameOutro = outroCompletion.choices[0].message.content;

  console.log(script);
  return script;
}

module.exports = { writeScript };
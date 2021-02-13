exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  if (args.length < 1) return;

  const p = [
    "rock",
    "paper" ,
    "scissors"
  ];

  let userChoice; 

  switch (args[0].toLowerCase()) {
    case "r":
    case "rock": 
      userChoice = p[0];
      break;
    case "p":
    case "paper": 
      userChoice = p[1];
      break;
    case "s":
    case "scissors": 
      userChoice = p[2];
      break;
    default:
      userChoice = null;
      break;
  }

  if (!userChoice) return message.react("❌").catch(console.error);

  const botChoice = p.random();

  const msg = await message.channel.send("1...2...3...Shoot!");

  let name; 
  if (message.guild) {
    name = (message.member.nickname) ? message.member.nickname :  message.author.username;
  }
  else {
    name = message.author.username;
  }


  // User wins
  async function winMsg() {
    await client.wait(1000);
    msg.edit(`**${name}** chose **${userChoice}** and I chose **${botChoice}**! You have won this time **${name}**...`);
  }

  // Bot wins
  async function lossMsg() {
    await client.wait(1000);
    msg.edit(`**${name}** chose **${userChoice}** and I chose **${botChoice}**! I win, eat it loser!`);
  }

  async function drawMsg() {
    await client.wait(1000);
    msg.edit(`**${name}** chose **${userChoice}** and I chose **${botChoice}**! Oh, we seem to have tied.`);
  }

  if ((botChoice === "rock" && userChoice === "paper") || (botChoice === "paper" && userChoice === "scissors") || (botChoice === "scissors" && userChoice === "rock")) 
    winMsg();
  if ((botChoice === "rock" && userChoice === "scissors") || (botChoice === "paper" && userChoice === "rock") || (botChoice === "scissors" && userChoice === "paper")) 
    lossMsg();
  if (botChoice === userChoice)
    drawMsg();

};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "rps",
  category: "Fun",
  description: "Challenge me to a game of rock, paper, scissors! I warn you, I'm the best.",
  usage: "rps (rock|paper|scissors). Can shorten to r, p, and s, respectively."
};
exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  let dice;
  let rolls;

  // Default arguments if they don't exist.
  if (args.length < 1)  {
    dice = 6;
    rolls = 1;
  }
  else {
    dice = (args[0].toLowerCase().startsWith("d")) ? parseInt(args[0].slice(1), 10) : parseInt(args[0], 10);
    rolls = parseInt(args[1], 10);
  }

  if (isNaN(dice)) return message.react("❌");
  if (rolls < 1 || isNaN(rolls)) { 
    rolls = 1;
  }


  const results = [];

  for (let i = 1; i <= parseInt(rolls, 10); i++) {
    const rollResult = 1 + Math.floor(Math.random() * parseInt(dice, 10));
    results.push(rollResult);
  }

  let name; 
  if (message.guild) {
    name = (message.member.nickname) ? message.member.nickname :  message.author.username;
  }
  else {
    name = message.author.username;
  }

  const msg = await message.channel.send("Rolling...");
  msg.edit(`**${name}** has rolled a D${dice} ${rolls} time(s)!
  \nResults: ${results.join(", ")}`);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["dice"],
  permLevel: "User"
};

exports.help = {
  name: "roll",
  category: "Fun",
  description: "Roll a dice!",
  usage: "roll d<number> <number of rolls> (Ex. roll d6 2 to give 2 rolls of a d6.) If no arugments are passed, does 1 D6 roll by default."
};
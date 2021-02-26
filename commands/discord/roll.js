exports.run = async (client, message, args, level, bot) => { // eslint-disable-line no-unused-vars
  //if (args.length < 1) return message.reply("Insufficient parameters.");
  
  const dice = (args[0].toLowerCase().startsWith("d")) ? parseInt(args[0].slice(1), 10) : parseInt(args[0], 10);
  let rolls = parseInt(args[1], 10);

  if (isNaN(dice)) return message.react("❌");
  if (rolls < 1 || isNaN(rolls)) { 
    rolls = 1;
  }

  if (dice < 2) return message.reply("What kind of dice are you running here???");

  const results = [];

  for (let i = 1; i <= rolls; i++) {
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
  usage: "roll d<number> <number of rolls> (Ex. roll d6 2 to give 2 rolls of a d6. Also accepts the number without starting with d (ex. roll 6 2))"
};
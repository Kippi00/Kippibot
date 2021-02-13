exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  if (args.length < 2) return message.reply("Insufficient parameters.");
  
  const dice = (args[0].toLowerCase().startsWith("d")) ? args[0].slice(1) : args[0];
  const rolls = args[1];
  
  if (!parseInt(dice, 10) || !parseInt(rolls, 10)) return message.react("❌");
  if (parseInt(rolls, 10) < 1) return message.reply("You need some amount of dice to roll dice, 4Head. You can't roll with 0 or negative dice");
  if (parseInt(dice, 10) < 2) return message.reply("What kind of dice are you running here???");

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
  usage: "roll d<number> <number of rolls> (Ex. roll d6 2 to give 2 rolls of a d6.)"
};
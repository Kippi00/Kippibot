const responses = [
  "As I see it, yes.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "It is certain.",
  "It is decidely so.",
  "Most likely.",
  "My reply is no.",
  "My sources say no.",
  "Outlook good.",
  "Outlook not so good.",
  "Reply hazy, try again.",
  "Signs point to yes.",
  "Very doubtful.",
  "Without a doubt.",
  "Yes",
  "Yes, definitely.",
  "You may rely on it.",
  "I'm watching Game of Thrones right now, go away."
];

exports.run = (client, message, args) => {
  if (!args[0])
    message.reply("I cannot predict a blank fortune.");
  else
    message.reply(`🎱 The magic Kippibot 8-ball predicts... ${responses.random()}`);
};

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "8ball",
  category: "Fun",
  description: "Get your local 8-ball prediction here! You may or may not like the results. YMMV.",
  usage: "8ball [message]"
};
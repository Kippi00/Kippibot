exports.run = async (discordClient, message, args, level) => {
  const friendly = discordClient.config.permLevels.find(l => l.level === level).name;
  message.reply(`Your permission level is: ${level} - ${friendly}`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "permlevel",
  category: "Miscellaneous",
  description: "Tells you your permission level for the current message location.",
  usage: "permlevel"
};

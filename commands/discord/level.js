const { MessageEmbed } = require("discord.js");

exports.run = async (client, message, args, level, bot) => { // eslint-disable-line no-unused-vars
  const discord = bot.discord;
  const target = await discord.getUserFromMention(args[0]);

  // If there is no mention, or it's invalid, get points from the user.
  if (!target) {
    const key =  `${message.guild.id}-${message.author.id}`;
    const currentLevel = discord.userProfiles.get(key, "level");
    const currentXp = discord.userProfiles.get(key, "xp");
    const nextLevelXp = Math.pow(10 * (currentLevel + 1), 2);
    const remainingXp = nextLevelXp - currentXp;
    const nickname = (message.member.nickname) ? message.member.nickname : message.author.username;
  
    const embed = new MessageEmbed()
      .setThumbnail(message.author.avatarURL())
      .setAuthor(nickname, message.author.avatarURL())
      .setTitle(message.author.username)
      .addField("Level", currentLevel)
      .addField("XP", currentXp)
      .addField("Next Level XP", remainingXp);
    
    message.channel.send(embed).catch(console.error);
  }

  // Get points from mentioned user
  else {
    const key =  `${message.guild.id}-${target.id}`;

    //To account for users that may have not been registered yet.
    if (!discord.userProfiles.get(key))
      return message.react("❌");

    const currentLevel = discord.userProfiles.get(key, "level");
    const currentXp = discord.userProfiles.get(key, "xp");
    const nextLevelXp = Math.pow(10 * (currentLevel + 1), 2) - currentXp;
    const member = await message.guild.members.cache.get(target.id);
    const nickname = (member.nickname) ? member.nickname : target.username;
  
    const embed = new MessageEmbed()
      .setThumbnail(target.avatarURL())
      .setAuthor(nickname, target.avatarURL())
      .setTitle(target.username)
      .addField("Level", currentLevel)
      .addField("XP", currentXp)
      .addField("Next Level XP", nextLevelXp);
    
    message.channel.send(embed).catch(console.error);
  }

};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ["rank", "xp", "lv"],
  permLevel: "User"
};

exports.help = {
  name: "level",
  category: "Fun",
  description: "See yours or someone else's current stats.",
  usage: "level (mention)"
};
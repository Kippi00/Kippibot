const { MessageEmbed } = require("discord.js");

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const guild = message.guild;
  // Load the leaderboard.
  const filter = client.userProfiles.filter(m => m.guild === message.guild.id);
  const xpArr = filter.map(m => {
    const obj = {
      user: m.user,
      level: m.level,
      xp: m.xp
    };
    return obj;
  });


  xpArr.sort((a, b) => b.xp - a.xp);

  switch (message.flags[0]) {
    case "leaderboard":
    case "l": {
      // Get top 10 users
      const top10 = xpArr.slice(0, 10);

      let description = "";

      for (let i = 0; i < top10.length; i++) {
        const member = await guild.members.cache.get(top10[i].user);
        const rank = i + 1;
        description += `**${rank}. ${member.nickname || member.user.username}**- LV: ${top10[i].level} - XP: ${top10[i].xp}\n`;
      }

      const embed = new MessageEmbed()
        .setTitle("XP Leaderboard: (Top 10)")
        .setDescription(description);

      message.channel.send(embed).catch(console.error);
      break;
    }
    default: {
      const target = await client.getUserFromMention(args[0]);
      if (!target) {
        const key =  `${message.guild.id}-${message.author.id}`;
        const currentLevel = client.userProfiles.get(key, "level");
        const currentXp = client.userProfiles.get(key, "xp");
        const nextLevelXp = Math.pow(10 * (currentLevel + 1), 2) - currentXp;
        const nickname = (message.member.nickname) ? message.member.nickname : message.author.username;
        const userObj = xpArr.find(e => e.user === message.author.id);
        const rank = 1 + xpArr.indexOf(userObj);

        console.log(rank);

  
        const embed = new MessageEmbed()
          .setThumbnail(message.author.avatarURL())
          .setAuthor(nickname, message.author.avatarURL())
          .setTitle(message.author.username)
          .addField("Level", currentLevel, true)
          .addField("Rank", rank, true)
          .addField("\u200b", "\u200b", true)
          .addField("Experience", currentXp, true)
          .addField("Next Level", nextLevelXp, true);
    
        message.channel.send(embed).catch(console.error);
      }

      // Get points from mentioned user
      else {
        const key =  `${message.guild.id}-${target.id}`;

        //To account for users that may have not been registered yet.
        if (!client.userProfiles.get(key))
          return message.react("❌");

        const currentLevel = client.userProfiles.get(key, "level");
        const currentXp = client.userProfiles.get(key, "xp");
        const nextLevelXp = Math.pow(10 * (currentLevel + 1), 2) - currentXp;
        const member = await message.guild.members.cache.get(target.id);
        const nickname = (member.nickname) ? member.nickname : target.username;
        const userObj = xpArr.find(e => e.user === member.id);
        const rank = 1 + xpArr.indexOf(userObj);

        console.log(rank);
  
        const embed = new MessageEmbed()
          .setThumbnail(target.avatarURL())
          .setAuthor(nickname, target.avatarURL())
          .setTitle(target.username)
          .addField("Level", currentLevel, true)
          .addField("Rank", rank, true)
          .addField("\u200b", "\u200b", true)
          .addField("Experience", currentXp, true)
          .addField("Next Level", nextLevelXp, true);
    
        message.channel.send(embed).catch(console.error);
      }

      break;
    }
  
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

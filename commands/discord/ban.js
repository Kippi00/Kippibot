exports.run = async (client, message, args, level, bot) => { // eslint-disable-line no-unused-vars
  const user = bot.discord.getUserFromMention(args[0]);
  if (!user) {
    message.react("❔");
    return message.reply("Inavlid user specified, please mention a user to ban.");
  }
  const member = message.guild.members.cache.find(m => m.id === user.id).catch(console.error);
  if (!member) {
    return message.reply("Inavlid user specified, please make sure that person is in the server.");
  }
  const reason = args.slice(1).join(" ");
  try {
    await member.ban(reason);
  } catch (e) {
    message.react("❌");
    return message.channel.send(`Failed to ban user **${member.user.tag}**. Reason: ${e}`);
  } 

  message.react("✔");
  if (reason)
    return message.channel.send(`Successfully banned **${member.user.tag}** with reason: ${reason}`);

  return message.channel.send(`Successfully banned **${member.user.tag}**`);
};
  
exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "Moderator"
};

exports.help = {
  name: "ban",
  category: "Moderation",
  description: "Ban the member out of the server, with reason. (optional)",
  usage: "ban [mention] (reason)"
};
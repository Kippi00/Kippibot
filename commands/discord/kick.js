exports.run = async (discordClient, message, args, level) => { // eslint-disable-line no-unused-vars
  const user = discordClient.getUserFromMention(args[0]);
  if (!user) {
    message.react("❔");
    return message.reply("Inavlid user specified, please mention a user to ban.");
  }
  const member = await message.guild.members.cache.find(m => m.id === user.id);
  if (!member) {
    return message.reply("Inavlid user specified, please mention a user to ban.");
  }
  const reason = args.slice(1).join(" ");
  try {
    await member.kick(reason);
  } catch (e) {
    message.react("❌");
    return message.channel.send(`Failed to kick user **${member.user.tag}**. Reason: ${e}`);
  } 

  message.react("✔");
  if (reason)
    return message.channel.send(`Successfully kicked **${member.user.tag}** with reason: ${reason}`);
  else 
    return message.channel.send(`Successfully kicked **${member.user.tag}**`);
};
  
exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "Moderator"
};

exports.help = {
  name: "kick",
  category: "Moderation",
  description: "Kicks the member out of the server, with reason. (optional)",
  usage: "kick [mention] (reason)"
};
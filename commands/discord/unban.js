exports.run = async (discordClient, message, args, level) => { // eslint-disable-line no-unused-vars
  const id = args[0];
  if (!id) {
    message.react("❔");
  }
  try {
    await message.guild.members.unban(id);
  } catch (e) {
    message.react("❌");
    return message.channel.send(`Failed to unban user by the ID **${id}**. Reason: ${e}`);
  } 

  message.react("✔");
  return message.channel.send(`Successfully unbanned user by the ID **${id}**`);
};
  
exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "Moderator"
};

exports.help = {
  name: "unban",
  category: "Moderation",
  description: "Removes a ban on a user by the specified ID.",
  usage: "unban [id]"
};
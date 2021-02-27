const { MessageEmbed } = require("discord.js");
const moment = require("moment");
module.exports = async (client, member) => {
  // Load the guild's settings
  const settings = client.getSettings(member.guild);

  // Replace the placeholders in the welcome message with actual data
  const welcomeMessage = settings.welcomeMessage.replace("{{user}}", member.user.tag);

  // Send the welcome message to the welcome channel
  // There's a place for more configs here.
  if (settings.welcomeEnabled === "true") member.guild.channels.cache.find(c => c.name === settings.welcomeChannel).send(welcomeMessage).catch(console.error);

  let ch;
  if (settings.modLog !== "true") return;

  if (isNaN(parseInt(settings.modLogChannel, 10))) {
    ch = await member.guild.channels.cache.find(c => c.name === settings.modLogChannel);
  }
  else {
    ch = await member.guild.channels.cache.get(settings.modLogChannel);
  }

  if (ch) {
    const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
    const embed = new MessageEmbed()
      .setAuthor(member.user.useername)
      .setColor(0x00FFFF)
      .setTitle("Type: Join")
      .setDescription(`Member ${member.user.tag} joined ${member.guild.name}`)
      .setTimestamp(timestamp);

    ch.send(embed).catch(console.error);
  }
};

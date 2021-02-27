const { MessageEmbed } = require("discord.js");
const moment = require("moment");
module.exports = async (client, member) => {
  // Load the guild's settings
  const settings = client.getSettings(member.guild);

  // If greeetings are off, don't proceed (don't say goodbye to the user)
  //if (settings.welcomeEnabled !== "true") return;

  // Replace the placeholders in the leave message with actual data
  const leaveMessage = settings.leaveMessage.replace("{{user}}", member.user.tag);

  if (settings.welcomeEnabled === "true") member.guild.channels.cache.find(c => c.name === settings.welcomeChannel).send(leaveMessage).catch(console.error);

  let ch;
  if (settings.modLog !== "true") return;

  if (isNaN(parseInt(settings.modLogChannel, 10))) {
    ch = await member.guild.channels.cache.find(c => c.name === settings.modLogChannel);
  }
  else {
    ch = await member.guild.channels.cache.get(settings.modLogChannel);
  }

  if (ch) {
    let executor = "";
    let reason = "";
    const logs = await member.guild.fetchAuditLogs({ type: 20}).catch(console.error);
    const banLog = await logs.entries.find(l => (l.target.username === member.user.username 
      && l.createdTimestamp > (Date.now() - 5000)));

    if (banLog) {
      executor = banLog.executor.username;
      reason = banLog.reason;
    }

    const timestamp = `[${moment().format("YYYY-MM-DD HH:mm:ss")}]:`;
    const embed = new MessageEmbed()
      .setAuthor(`${executor || "Unknown Executor"}`)
      .setColor(0xFFA500)
      .setTitle("Type: Kick")
      .setDescription(`Member ${member.user.tag} has been kicked from ${member.guild.name}`)
      .setTimestamp(timestamp);

    embed.addField("Reason", `${reason || "No Reason"}`);

    ch.send(embed).catch(console.error);
  }
};
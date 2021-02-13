module.exports = (bot, member) => {
  // Load the guild's settings
  const settings = bot.getSettings(member.guild);

  // If greeetings are off, don't proceed (don't say goodbye to the user)
  if (settings.welcomeEnabled !== "true") return;

  // Replace the placeholders in the leave message with actual data
  const leaveMessage = settings.leaveMessage.replace("{{user}}", member.user.tag);

  member.guild.channels.cache.find(c => c.name === settings.welcomeChannel).send(leaveMessage).catch(console.error);
};
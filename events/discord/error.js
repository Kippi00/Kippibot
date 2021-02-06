module.exports = async (discordClient, error) => {
  discordClient.logger.log(`An error event was sent by Discord.js: \n${JSON.stringify(error)}`, "error");
};

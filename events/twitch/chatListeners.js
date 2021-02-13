// eslint-disable-next-line no-unused-vars
module.exports = async (twitchClient, apiClient) => {

  twitchClient.onJoin((channel, user) => {
    twitchClient.logger.log(`${user} is joining channel ${channel}`);
  });

  twitchClient.onMessage(async (channel, user, message) => {
    if (message === "!ping") {
      twitchClient.say(channel, "Pong!");
    }
  });
};

/*
if (message === "foo") {
  twitchClient.say(channel, "bar");
} else if (message === "!ping") {
  twitchClient.say(channel, "Pong!");
} else if (message === "!title") {
  try {
    const user = await apiClient.helix.users.getUserByName(channel.slice(1));
    const id = user.id;
    const channelInfo = await apiClient.helix.channels.getChannelInfo(id);
    const title = channelInfo.title;
    twitchClient.say(channel, `Status: ${title}`);
  } catch (e) {
    twitchClient.logger.error(e);
    twitchClient.say(channel, "Status: [API ERROR]");
  }
} else if (message === "!testupdate") {
  try {
    const user = await apiClient.helix.users.getUserByName(channel.slice(1));
    const id = user.id;
    const data = {
      gameId: "33214",
      title: "Testing the update command"
    };
    await apiClient.helix.channels.updateChannelInfo(id, data);
    twitchClient.say(channel, `Status update: ${data.title} (Game: ${data.gameId})`);
  } catch (e) {
    twitchClient.logger.error(e);
    twitchClient.say(channel, "Error updating game.");
  }
} else if (message === "!test") {
  const t = await apiClient.getTokenInfo();
  console.log(t.scopes);
}
*/
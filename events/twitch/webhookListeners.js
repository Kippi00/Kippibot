//deprecated. We don't need Webhooks, when EventSub is superior.

module.exports = async (twitchClient, apiClient, discordClient) => { // eslint-disable-line no-unused-vars
  const webhookListener = apiClient.webhookListener;
  const userId = apiClient.userId;
  const channelInfo = await apiClient.helix.channels.getChannelInfo(userId);
  const channel = `#${channelInfo.displayName.toLowerCase()}`;
  let streamStatus = await apiClient.helix.streams.getStreamByUserId(userId);
  webhookListener.subscribeToFollowsToUser(userId, async (f) => {
    try {
      const user = f.userName;
      console.log(`${user} has followed ${f.followedUserName}!`);
      //const chan = `#${f.followedUserName}`;
      twitchClient.say(channel, `${user}, thank you for the follow!`);
    } catch (e) {
      console.error(e);
    }
  });

  webhookListener.subscribeToStreamChanges(userId, async (s) => {
    try {
      if (s) {
        if (streamStatus) {
          const game = await s.getGame();
          if (game.name) {
            console.log(`${s.userDisplayName} has gone live with ${game.name}! Title: ${s.title}`);
          }
          console.log(`${s.userDisplayName} has gone live! Title: ${s.title}`);
        }
        
      } else {
        console.log(`${channelInfo.displayName} has gone offline.`);
      }
      streamStatus = (s) ? s : null;
    } catch (e) {
      console.error(e);
    }
  });
};
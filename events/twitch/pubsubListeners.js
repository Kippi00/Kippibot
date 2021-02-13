// We will still need PubSub for cheer alerts if we want to get the total bits amount,

module.exports = async (twitchClient, apiClient, discordClient) => { // eslint-disable-line no-unused-vars
  const pubSubClient = apiClient.pubSubClient;
  const userId = apiClient.userId;
  const channelInfo = await apiClient.helix.channels.getChannelInfo(userId);
  const channel = `#${channelInfo.displayName.toLowerCase()}`;
  const bitsListener = await pubSubClient.onBits(userId, async (b) => { // eslint-disable-line no-unused-vars
    try {
      if (b.isAnonymous) {
        console.log(`Anonymous cheered for ${b.bits} bits!`);
        twitchClient.say(channel, `Anonoymous has cheered for ${b.bits} bits! Thank you so much <3`);
      } else {
        console.log(`${b.userName} cheered for ${b.bits} bits!`);
        twitchClient.say(channel, `${b.userName} has cheered for ${b.bits} bits, and has cheered for an all-time total of ${b.totalBits}! Thank you so much <3`);
      }
    } catch (e) {
      console.error(e);
    }
  });

};
const { MessageEmbed } = require("discord.js");
const moment = require("moment");

module.exports = async (bot) => { // eslint-disable-line no-unused-vars
  const eventClient = bot.twitch.eventClient;
  const twitchClient = bot.twitch.chatClient;
  const discordClient = bot.discord.client;
  const userId = eventClient.userId;
  const ownerChannelInfo = await eventClient.helix.channels.getChannelInfo(userId);
  const ownerChannel = `#${ownerChannelInfo.displayName.toLowerCase()}`;
  const listener = eventClient.listener;

  const channels = bot.twitch.channels;


  // Called whenever the bot initially starts, or when a new channel is added to the database.
  bot.twitch.eventClient.updateSubs = async c => {
    let exists = false;
    for await (const subscription of eventClient.helix.eventSub.getSubscriptionsPaginated()) {
      if (subscription.condition.broadcaster_user_id === c.id && (subscription.type === "stream.online" || subscription.type === "stream.offline")) {
        exists = true;
        break;
      }
    }

    let game = null;
    let title = null;
    let stream = null;
    let user = null;
    let m = "";

    //If we're not already subcribed to the channel online events, subscribe to them.
    if (!exists) {
      await listener.subscribeToStreamOnlineEvents(c.id, async e => {
        // Only do stuff on livestreams, not on something like reruns.
        if (e.streamType !== "live") return;
        try {
          user = await e.getBroadcaster();
          stream = await user.getStream();
          game = await stream.getGame();
          title = stream.title;
          console.log(`${e.broadcasterDisplayName} went live!`);
          c.discords.forEach(async d => {
            if (d.)
            const guild = d.guild;
            const chan = d.channel;
            const msg = d.msg;
            const url = `https:/twitch.tv/${c.username}`;
            const gameName = (game) ? game.name : "No Game Set";
            msg.replace("{{game}}", gameName).replace("{{title}}", title)
              .replace("{{channel}}", e.broadcasterDisplayName).replace("{{url}}", url);
            if (d.twitchMsgEmbed) {
              const thumbnail = (e.thumbnailUrl !== "") ? e.thumbnailUrl : "https://static-cdn.jtvnw.net/ttv-static/404_preview-1920x1080.jpg";
              const avatar = user.profilePictureUrl;
              const timestamp = `${moment(e.startDate).format("LLL")}`;
              thumbnail.replace("{width}", "1920").replace("{height}", "1080");
              const embed = new MessageEmbed()
                .setAuthor(`${e.broadcasterDisplayName} is now live on Twitch!`, avatar, url)
                .setTitle(title)
                .setURL(url)
                .setThumbnail(thumbnail)
                .setDescription(`Playing: ${gameName}\n[Stream Link](${url})`)
                .addField("Viewers", stream.viewers)
                .setFooter(timestamp);

              m = await discordClient.guilds.cache.get(guild).channels.cache.get(chan).send(msg, {
                embed: embed
              });
            }
            else {
              m = await discordClient.guilds.cache.get(guild).channels.cache.get(chan).send(msg);
            }


          });
          
        } catch (err) {
          bot.logger.error(err);
        }
      });
      await listener.subscribeToStreamOfflineEvents(c.id, async e =>{
        console.log(`${e.broadcasterDisplayName} went offline.`);
        
      });
      bot.logger.log(`[TWITCH] Subscribed to stream online/offline notifications for channel ${c.username}`);
    }

  };


  channels.forEach(async c => {
    bot.twitch.eventClient.updateSubs(c.id);
  });

  // Follower alert
  await listener.subscribeToChannelFollowEvents(userId, async e => {
    console.log(`${e.userDisplayName} has followed ${e.broadcasterDisplayName}!`);
    twitchClient.say(ownerChannel, `${e.userDisplayName}, thank you for the follow! Welcome to the Realm :D`);
  });

  /*
  const onlineSubscription = await listener.subscribeToStreamOnlineEvents(userId, async e => {
    try {
      const user = await e.getBroadcaster();
      let game = null;
      let title = null;
      let stream = null;
      if (user) {
        stream = await user.getStream();
        if (stream) {
          game = await stream.getGame();
          title = stream.title;
        }
      }
      if (game) {
        return console.log(`${e.broadcasterDisplayName} went live with ${game.name}! Title: ${title}`)
      }
      if (title) {
        return console.log(`${e.broadcasterDisplayName} went live! Title: ${title}`);
      }
      return console.log(`${e.broadcasterDisplayName} went live!`);
    } catch (err) {
      console.error(e);
    }
  });

  const offlineSubscription = await listener.subscribeToStreamOfflineEvents(userId, async e => {
    try {
      console.log(`${e.broadcasterDisplayName} has went offline.`);
    } catch (err) {
      console.error(err);
    }
  });
  */

};
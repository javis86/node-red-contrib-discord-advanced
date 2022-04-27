const {
  Client,
  Intents,
} = require('discord.js');
var bots = new Map();
var getBot = async function (configNode) {  
    var bot = undefined;
    if (bots.get(configNode) === undefined) {
      bot = new Client({
        intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
          Intents.FLAGS.DIRECT_MESSAGES,
          Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
        ],
        partials: [
          "CHANNEL",
          "USER",
          "MESSAGE"
        ]
      });
      bot.numReferences = (bot.numReferences || 0) + 1;      
      bots.set(configNode, bot);
      
      // bot.getChannel = async (id) => {
      //   return await this.channels.fetch(id);
      // }

      // bot.getMessage = async (channel, message) => {        
      //   const channelID = checkIdOrObject(channel);
      //   const messageID = checkIdOrObject(message);
      //   if (!channelID) {
      //     throw new Error(`channel wasn't set correctly`);
      //   } else if (!messageID) {
      //     throw new Error(`message wasn't set correctly`);
      //   } else {
      //     let channel = await this.getChannel(channelID)
      //     return await channel.messages.fetch(messageID);
      //   }
      // }

      await bot.login(configNode.token);
      return bot;
    } else {
      bot = bots.get(configNode);
      bot.numReferences = (bot.numReferences || 0) + 1;
      return bot;
    }
};

var closeBot = function (bot) {
  bot.numReferences -= 1;
  setTimeout(function () {
    if (bot.numReferences === 0) {
      try {
        bot.destroy(); // if a bot is not connected, destroy() won't work, so let's just wrap it in a try-catch..
      } catch (e) {}
      for (var i of bots.entries()) {
        if (i[1] === bot) {
          bots.delete(i[0]);
        }
      }
    }
  }, 1000);
};
module.exports = {
  getBot: getBot,
  closeBot: closeBot
}

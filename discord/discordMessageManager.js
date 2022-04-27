module.exports = function (RED) {
  var discordBotManager = require('./lib/discordBotManager.js');
  const Flatted = require('flatted');
  const {
    MessageAttachment,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu
  } = require('discord.js');

   function discordMessageManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var configNode = RED.nodes.getNode(config.token);
    
        
    discordBotManager.getBot(configNode).then( bot => {
      node.on('input', async function (msg, send, done) {
        const action = msg.action || 'create';
        const payload = msg.payload || ' ';
        const channel = config.channel || msg.channel || null;
        const user = msg.user || null;
        const message = msg.message || null;
        const inputEmbeds = msg.embeds || msg.embed;
        const timeDelay = msg.timedelay || 0;
        const inputAttachments = msg.attachments || msg.attachment;
        const inputComponents = msg.components;

        const setError = (error) => {
          node.status({
            fill: "red",
            shape: "dot",
            text: error
          })
          done(error);
        }

        const setSucces = (succesMessage, data) => {
          node.status({
            fill: "green",
            shape: "dot",
            text: succesMessage
          });
          const newMsg = {
            payload: Flatted.parse(Flatted.stringify(data)),
            request: msg,
          };
          send(newMsg);
          done();
        }

        const checkIdOrObject = (check) => {
          try {
            if (typeof check !== 'string') {
              if (check.hasOwnProperty('id')) {
                return check.id;
              } else {
                return false;
              }
            } else {
              return check;
            }
          } catch (error) {
            return false;
          }
        }

        const getChannel = async (id) => {
          return await bot.channels.fetch(id);
        }

        const getMessage = async (channel, message) => {
          const channelID = checkIdOrObject(channel);
          const messageID = checkIdOrObject(message);
          let channelInstance = await getChannel(channelID);
          return await channelInstance.messages.fetch(messageID);
        }

        const createPrivateMessage = async () => {
          const userID = checkIdOrObject(user);
          if (!userID) {
            setError(`msg.user wasn't set correctly`);
            return;
          }

          try {
            let user = await bot.users.fetch(userID);
            let messageObject = {};
            messageObject.embeds = embeds;
            messageObject.content = payload;
            messageObject.files = attachments;
            messageObject.components = components;
            let message = await user.send(messageObject);
            setSucces(`message sent to ${message.channel.recipient.username}`, message)
          } catch (error) {
            setError(error);
          }
        }

        const createChannelMessage = async () => {
          const channelID = checkIdOrObject(channel);
          if (!channelID) {
            setError(`msg.channel wasn't set correctly`);
            return;
          }

          try {
            let channelInstance = await getChannel(channelID);
            let messageObject = {};
            messageObject.embeds = embeds;
            messageObject.content = payload;
            messageObject.files = attachments;
            messageObject.components = components;
            let discordMessage = await channelInstance.send(messageObject);
            setSucces(`message sent, id = ${discordMessage.id}`, discordMessage);
          } catch (error) {
            setError(error);
          }
        }

        const createMessage = async () => {
          if (user) {
            await createPrivateMessage();
          } else if (channel) {
            await createChannelMessage();
          } else {
            setError('to send messages either msg.channel or msg.user needs to be set');
          }
        }

        const editMessage = async () => {
          try {
            let discordMessage = await getMessage(channel, message);

            let messageObject = {};
            messageObject.embeds = embeds;
            messageObject.content = payload;
            messageObject.files = attachments;
            messageObject.components = components;
            let messageEdited = await discordMessage.edit(messageObject);

            setSucces(`message ${messageEdited.id} edited`, messageEdited);
          } catch (error) {
            setError(err);
          }
        }

        const deleteMessage = async () => {
          try {
            let discordMessage = await getMessage(channel, message);
            await discordMessage.delete({ timeout: timeDelay });
            setSucces(`message ${discordMessage.id} deleted`, discordMessage);
          } catch (error) {
            setError(error);
          }
        }

        var attachments = [];
        if (inputAttachments) {
          if (typeof inputAttachments === 'string') {
            attachments.push(new MessageAttachment(inputAttachments));
          } else if (Array.isArray(inputAttachments)) {
            inputAttachments.forEach(attachment => {
              attachments.push(new MessageAttachment(attachment));
            });
          } else {
            setError("msg.attachments isn't a string or array")
          }
        }

        var embeds = [];
        if (inputEmbeds) {
          if (typeof inputEmbeds === 'object') {
            embeds.push(new MessageEmbed(inputEmbeds));
          } else if (Array.isArray(inputEmbeds)) {
            inputEmbeds.forEach(embed => {
              embeds.push(new MessageEmbed(embed));
            });
          } else {
            setError("msg.embeds isn't a string or array")
          }
        }

        var components = [];
        if (inputComponents) {
          inputComponents.forEach(component => {
            if (component.type == 1) {
              var actionRow = new MessageActionRow();
              component.components.forEach(subComponentData => {
                switch (subComponentData.type) {
                  case 2:
                    actionRow.addComponents(new MessageButton(subComponentData));
                    break;
                  case 3:
                    actionRow.addComponents(new MessageSelectMenu(subComponentData));
                    break;
                }
              });
              components.push(actionRow);
            }
          });
        }

        switch (action.toLowerCase()) {
          case 'create':
            await createMessage();
            break;
          case 'edit':
            await editMessage();
            break;
          case 'delete':
            await deleteMessage();
            break;
          default:
            setError(`msg.action has an incorrect value`)
        }

        node.on('close', function () {
          discordBotManager.closeBot(bot);
        });
      });
    }).catch( error => {
      console.log(error);
    });    
  }

  RED.nodes.registerType("discordMessageManager", discordMessageManager);
};

module.exports = function (RED) {
  var discordBotManager = require('node-red-contrib-discord-advanced/discord/lib/discordBotManager.js');
  const { checkIdOrObject } = require('./lib/discordFramework.js');


  const Flatted = require('flatted');
  const { REST, Routes } = require('discord.js');

  const checkString = (field) => typeof field === 'string' ? field : false;

  function discordCommandManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var configNode = RED.nodes.getNode(config.token);

    var bot = discordBotManager.getBot(configNode)

    bot.then(function (bot) {
      node.on('input', async function (msg, send, done) {
        const _guildId = config.guild || msg.guild || null;
        const _action = msg.action || null;
        const _commands = msg.commands || null;
        const _commandID = msg.commandId || null;

        const setError = (error) => {
          node.status({
            fill: "red",
            shape: "dot",
            text: error
          })
          done(error);
        }

        const setSuccess = (succesMessage, data) => {
          node.status({
            fill: "green",
            shape: "dot",
            text: succesMessage
          });

          msg.payload = Flatted.parse(Flatted.stringify(data));
          send(msg);
          done();
        }
    
        const deleteCommand = async () => {
          try {

            let commandId = _commandID;
            const rest = new REST().setToken(bot.token);
            const guildId = checkIdOrObject(_guildId);

            let data = null;

            if (commandId != null) {
              if (guildId) {
                data = await rest.delete(Routes.applicationGuildCommand(bot.id, guildId, commandId));
              }
              else {
                data = await rest.delete(Routes.applicationCommand(bot.id, commandId))
              }

              if (data == null) {
                setError(`Could not delete application (/) command '${commandId}'.`);
              }
              else {
                setSuccess(`Successfully deleted application (/) command '${commandId}'.`, data);
              }

            }
            else {

              if (guildId) {
                data = await rest.put(Routes.applicationGuildCommands(bot.id, guildId), { body: [] })
              }
              else {
                data = await rest.put(Routes.applicationCommands(bot.id), { body: [] })
              }

              if (data == null) {
                setError(`Could not delete all application (/) commands.`);
              }
              else {
                setSuccess(`Successfully deleted all application (/) commands.`, data);
              }
            }
          } catch (err) {
            setError(err);
          }
        }

        const setCommand = async () => {
          try {

            let commands = _commands;

            if (commands == null) {
              setError(`msg.commands wasn't set correctly`);
              return;
            }
            else {

              if (commands.length == 0) {

                setError(`msg.commands wasn't set correctly`);
                return;
              }
            }

            const rest = new REST().setToken(bot.token);
            const guildId = checkIdOrObject(_guildId);

            let data = null;

            if (guildId) {
              data = await rest.put(
                Routes.applicationGuildCommands(bot.id, guildId),
                { body: commands },
              );
            }
            else {
              data = await rest.put(
                Routes.applicationCommands(bot.id),
                { body: commands },
              );
            }

            if (data == null) {
              setError("Could not set application commands");
            }
            else {
              setSuccess(`Successfully reloaded ${data.length} application (/) commands.`, data);
            }
          } catch (err) {
            setError(err);
          }
        }

        if (_action == null) {
          setError(`msg.action has no value`)
        }
        else {
          switch (_action.toLowerCase()) {
            case 'set':
              await setCommand();
              break;
            case 'delete':
              await deleteCommand();
              break;
            default:
              setError(`msg.action has an incorrect value`)
          }
        }

        node.on('close', function () {
          discordBotManager.closeBot(bot);
        });
      });
    }).catch(err => {
      console.log(err);
      node.status({
        fill: "red",
        shape: "dot",
        text: err
      });
    });
  }
  RED.nodes.registerType("discordCommandManager", discordCommandManager);
};

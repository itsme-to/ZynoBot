const { EmbedBuilder, InteractionType, ApplicationCommandOptionType, ChannelType } = require('discord.js');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const { ValueSaver } = require("valuesaver");

function commandResolver(data){
    return data.reduce((arr, item) => {
        var add;
        if(item.type === ApplicationCommandOptionType.Subcommand || item.type === ApplicationCommandOptionType.SubcommandGroup){
            add = [item.name];
            add.push(...commandResolver(item.options));
        } else if(item.type === ApplicationCommandOptionType.String){
            add = item.value.split(' ');
        } else if(item.type === ApplicationCommandOptionType.Number || item.type === ApplicationCommandOptionType.Integer){
            add = item.value;
        } else if(item.type === ApplicationCommandOptionType.Channel){
            add = item.channel;
        } else if(item.type === ApplicationCommandOptionType.Role){
            add = item.role
        } else if(item.type === ApplicationCommandOptionType.User){
            add = item.user;
        } else if(item.type === ApplicationCommandOptionType.Boolean){
            add = item.value;
        }
        if(Array.isArray(add)){
            arr.push(...add);
        } else {
            arr.push(add);
        }
        return arr;
    }, []);
}

return module.exports = {
    data: {
        name: 'interactionCreate',
        type: 'on'
    },
    callback: function(client){
        return async function(interaction){
            if(!client.ready) return;
            if(interaction.channel.type !== ChannelType.DM){
                if(Object.keys(client.mainguilds).indexOf(interaction.guild.id) < 0) return;
            }
            if(client.dbTransfer) return;

            let serverId = interaction.channel.type !== ChannelType.DM ? interaction.guild.id : `DM`;

            if(client.config.debugger) console.log(`[SYSTEM] Received interaction from user with id ${interaction.user.id} in server with id ${serverId}`);

            var interactionId;
            if(interaction.type === InteractionType.ApplicationCommand){
                interactionId = interaction.commandName.toLowerCase();
            } else {
                interactionId = (interaction.customId.indexOf('__') >= 0 ? interaction.customId.split('__')[0] : interaction.customId);
            }
            if(interaction.isButton() && client.interactions instanceof ValueSaver && client.interactionInfo instanceof ValueSaver){
                if(client.interactionInfo.get(`ignore`).get(interaction.user.id) || client.interactionInfo.get(`ignore`).get(interaction.id)) return;
                const btninteraction = client.interactions.get(interactionId);
                
                if(client.config.debugger && btninteraction) console.log(`[SYSTEM] Found interaction action for button with id ${interactionId} in server with id ${serverId}`);

                if(btninteraction) btninteraction.run(client, interaction, false);
                else {
                    if(client.config.debugger) console.log(`[SYSTEM] Passing interaction action for button with id ${interactionId} in server with id ${serverId} to addon system`);
                    client.clientParser.event.emit('button', interaction);
                }
            } else if(interaction.type === InteractionType.ApplicationCommand && client.commands instanceof ValueSaver){
                let args = [interaction.commandName.toLowerCase(), ...commandResolver(interaction.options.data)];
                let cmdName = [args[0].toLowerCase()];
                let cmd = client.commands.get(cmdName.join(' '));
                if(cmd){
                    while(cmd.data.subCommandParent === true && cmdName.length < args.length){
                        cmdName.push(args[cmdName.length].toLowerCase());
                        cmd = client.commands.get(cmdName.join(' '));
                        if(!cmd) break;
                    }
                    if(!cmd) return;
                    if(cmd.data.subCommandParent === true) return;
                    if(cmd.data.defaultEnabled === true){
                        try{
                            await client.clientParser.commandAvailability(interaction, true);
                        } catch {
                            if(client.config.debugger) console.log(`[SYSTEM] Prevented from executing command ${cmd.data.name} from interaction with id ${interaction.commandName} by addon`);
                            return;
                        }
                        if(client.config.debugger) console.log(`[SYSTEM] Executing command ${cmd.data.name} from interaction with id ${interaction.commandName}`);
                        return cmd.run(client, args, interaction, true);
                    } else {
                        const disabledEmbed = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.commandDisabled.title))
                        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.commandDisabled.message))
                        .setTimestamp();
                        if(typeof client.config[cmd.data.category.toLowerCase()] === 'boolean'){
                            if(client.config[cmd.data.category.toLowerCase()] === true){
                                try{
                                    await client.clientParser.commandAvailability(interaction, true);
                                } catch {
                                    if(client.config.debugger) console.log(`[SYSTEM] Prevented from executing command ${cmd.data.name} from interaction with id ${interaction.commandName} by addon`);
                                    return;
                                }
                                if(client.config.debugger) console.log(`[SYSTEM] Executing command ${cmd.data.name} from interaction with id ${interaction.commandName}`);
                                return cmd.run(client, args, interaction, true);
                            } else return interaction.reply({embeds: [disabledEmbed], ephemeral: true}).catch(err = {});
                        } else if(typeof client.config[cmd.data.category.toLowerCase()] === 'object'){
                            if(typeof client.config[cmd.data.category.toLowerCase()].enabled === 'boolean'){
                                if(client.config[cmd.data.category.toLowerCase()].enabled === true){
                                    try{
                                        await client.clientParser.commandAvailability(interaction, true);
                                    } catch {
                                        if(client.config.debugger) console.log(`[SYSTEM] Prevented from executing command ${cmd.data.name} from interaction with id ${interaction.commandName} by addon`);
                                        return;
                                    }
                                    if(client.config.debugger) console.log(`[SYSTEM] Executing command ${cmd.data.name} from interaction with id ${interaction.commandName}`);
                                    return cmd.run(client, args, interaction, true);
                                } else return interaction.reply({embeds: [disabledEmbed], ephemeral: true}).catch(err => {});
                            }
                        }
                    }
                } else if(client.addons.get(interaction.commandName.toLowerCase())){
                    if(client.config.debugger) console.log(`[SYSTEM] Command ${interaction.commandName.toLowerCase()} found within addon system`);
                    client.clientParser.interactionHandler.emit('execute', interaction, true);
                }
            } else if(client.interactions instanceof ValueSaver && (interaction.isStringSelectMenu() || interaction.type === InteractionType.ModalSubmit)){
                const sminteraction = client.interactions.get(interactionId);
                if(client.config.debugger && sminteraction) console.log(`[SYSTEM] Found interaction action for ${interaction.type === InteractionType.ModalSubmit ? "form" : "menu"} with id ${interactionId} in server with id ${serverId}`);
                else if(client.config.debugger) console.log(`[SYSTEM] Passing interaction action for ${interaction.type === InteractionType.ModalSubmit ? "form" : "menu"} with id ${interactionId} in server with id ${serverId} to addon system`);
                if(sminteraction) sminteraction.run(client, interaction);
                else if(interaction.isStringSelectMenu()){
                    client.clientParser.event.emit('menu', interaction);
                } else if(interaction.type === InteractionType.ModalSubmit){
                    client.clientParser.event.emit('modal', interaction);
                }
            }
        }
    }
}
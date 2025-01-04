const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { ValueSaver } = require('valuesaver');
const messageHandler = require('../../handlers/handleMessages');
const messages = require('../../messages.json');

function firstUpperCase(string){
    return string.slice(0, 1).toUpperCase() + string.slice(1);
}

module.exports = {
    data: {
        name: 'help',
        description: 'Explanation how to use the bot',
        category: 'General',
        options: [],
        defaultEnabled: true,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const categoryInfo = client.commands.toReadableArray().concat(client.addons.toReadableArray().map(a => {
            return {
                value: {
                    data: {
                        ...(a.value.command),
                        defaultEnabled: true,
                        visible: true
                    }
                }
            };
        })).reduce((valuesaver, item) => {
            const { value } = item;
            if(value.data.defaultEnabled === false){
                if(typeof client.config[value.data.category.toLowerCase()] === 'boolean'){
                    if(client.config[value.data.category.toLowerCase()] === false){
                        return valuesaver;
                    }
                } else if(typeof client.config[value.data.category.toLowerCase()] === 'object'){
                    if(typeof client.config[value.data.category.toLowerCase()].enabled === 'boolean'){
                        if(client.config[value.data.category.toLowerCase()].enabled === false){
                            return valuesaver;
                        }
                    } else {
                        throw new Error(`Invalid category '${value.data.category.toLowerCase()}' in command config.json`)
                    }
                } else {
                    throw new Error(`Invalid type of category '${typeof client.config[value.data.category.toLowerCase()]}' in config.json (${value.data.category})`)
                }
            }
            if(value.data.visible === true){
                const categoryName = value.data.category.slice(0, 1).toUpperCase() + value.data.category.slice(1);
                var save = valuesaver.get(categoryName);
                if(save){
                    save = [...save];
                    save.push(value);
                    valuesaver.set(categoryName, save);
                } else {
                    valuesaver.set(categoryName, [value]);
                }
            }
            return valuesaver;
        }, new ValueSaver());

        var helpEmbed;

        if(client.config.helpEmbedFull === true){            
            helpEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.general.help.full['category-select'].title))
            .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.general.help.full['category-select'].message))
            .setFields(client.config.categories.reduce((arr, item) => {
                arr.push({
                    name: `${item.emoji} ${firstUpperCase(item.category)}`,
                    value: `${categoryInfo.get(firstUpperCase(item.category))?.length ?? 0} commands`,
                    inline: true
                })
                return arr;
            }, []))
            .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help-select-category')
            .setPlaceholder('No category selected')
            .setOptions(client.config.categories.reduce((arr, item) => {
                arr.push({
                    label: firstUpperCase(item.category),
                    value: item.category,
                    emoji: item.emoji
                });
                return arr;
            }, []));

            let helpActionRow = new ActionRowBuilder().addComponents(selectMenu);

            sendMessage({embeds: [helpEmbed], components: [helpActionRow]}).then(msg => {
                const collector = msg.createMessageComponentCollector({
                    filter: i => i.member.id === message.member.id,
                    max: 1,
                    time: 3*6e4
                });

                collector.once('collect', i => {
                    if(i.customId === 'help-select-category'){
                        const categoryName = firstUpperCase(i.values[0]);
                        const commands = categoryInfo.get(categoryName).reduce((str, item) => {
                            let commandMsg = messageHandler(client, message.member.user, undefined, message.channel, messages.general.help.full.category.command, [{COMMAND: (client.config['message-commands'] ? client.config.prefix : `/`)+item.data.name, DESCRIPTION: item.data.description}])
                            if(str.length > 0) str += `\n${commandMsg}`;
                            else str += commandMsg;
                            return str;
                        }, ``);

                        const newHelpEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.general.help.full.category.title, [{CATEGORY: firstUpperCase(categoryName)}]))
                        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.general.help.full.category.message, [{CATEGORY: firstUpperCase(categoryName), COMMANDS: commands}]))
                        .setTimestamp();

                        i.update(client.handleContent(message, {embeds: [newHelpEmbed], components: []})).catch(err => {});
                    }
                });

                collector.once('end', collected => {
                    if(collected.size === 0){
                        selectMenu.setDisabled(true);
                        helpActionRow = new ActionRowBuilder().addComponents(selectMenu);
                        msg.edit({embeds: [helpEmbed], components: [helpActionRow]}).catch(err => {});
                    }
                })
            }).catch(err => {});
        } else {
            const commandInfo = categoryInfo.toReadableArray().reduce((string, item) => {
                const { key, value } = item;
                
                if(string.length === 0) string += `**${client.config.categories.filter(c => c.category === key.toLowerCase())[0].emoji} ${key} ─ ${value.length}**\n`;
                else string += `\n\n**${client.config.categories.filter(c => c.category === key.toLowerCase())[0].emoji} ${key} ─ ${value.length}**\n`;
                for(var i = 0; i < value.length; i++){
                    const cmd = value[i];
                    if(i === 0) string += "`"+(client.config['message-commands'] ? client.config.prefix : `/`)+cmd.data.name+"`";
                    else string += ", `"+(client.config['message-commands'] ? client.config.prefix : `/`)+cmd.data.name+"`"
                }
                return string;
            }, ``);

            helpEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Help`)
            .setDescription(`${commandInfo}`)
            .setTimestamp();

            sendMessage({embeds: [helpEmbed]}).catch(err => {});
        }
    }
}
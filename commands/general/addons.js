const { EmbedBuilder, User, Team, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const messages = require('../../messages.json');
const messageHandler = require('../../handlers/handleMessages.js');
const { wait, getPermissionsString } = require('../../functions.js');
const package = require('../../package.json');

module.exports = {
    data: {
        name: 'addons',
        description: 'An addon manager to manage the installed addons',
        permissions: 'Administrator',
        options: [],
        category: 'General',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const notOwner = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons['error-messages']['not-owner'].title))
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons['error-messages']['not-owner'].message))
        .setTimestamp();

        if(message.member.id !== client.application.ownerId){
            if(client.application.owner instanceof User){
                if(client.application.owner.id !== message.member.id){
                    return sendMessage({embeds: [notOwner]}).catch(err => {});
                }
            } else if(client.application.owner instanceof Team) {
                if(!client.application.owner.members.get(message.member.id)){
                    return sendMessage({embeds: [notOwner]}).catch(err => {});
                }
            } else {
                return sendMessage({embeds: [notOwner]}).catch(err => {});
            }
        }

        const checkEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons['loading-addons'].title))
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons['loading-addons'].message))
        .setTimestamp();

        let sentMsg = null;
        try{
            sentMsg = await sendMessage({embeds: [checkEmbed]});

            await client.readAddons(false, true);
        } catch {}

        function selectAddon(page = 1, edited = true, ended = false){

            const noAddons = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true, size: 256})})
            .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons['error-messages']['no-addons-installed'].title))
            .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons['error-messages']['no-addons-installed'].message))
            .setTimestamp();

            if(!client.clientParser.addons) return sendMessage({embeds: [noAddons]}).catch(err => {});

            const addons = client.clientParser.addons.toReadableArray();
            if(addons.length < page) page = addons.length;
            else if(page <= 0) page = 1;
            const addon = addons[page - 1];

            if(!addon) return sendMessage({embeds: [noAddons]}).catch(err => {});

            const pageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
            .setCustomId('page-button-addons')
            .setLabel('Page '+page+'/'+addons.length);
            
            const previousPageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId(`previous-page`)
            .setLabel(`◀️`);
            const nextPageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId(`next-page`)
            .setLabel(`▶️`);
            if(page <= 1 || ended === true){
                previousPageButton.setDisabled(true);
            }
            if(page >= addons.length || ended === true){
                nextPageButton.setDisabled(true);
            }

            const pageActionRow = new ActionRowBuilder().addComponents(previousPageButton, pageButton, nextPageButton);

            const startButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('start-addon')
            .setEmoji('🟢')
            .setLabel('Start');
            const restartButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('restart-addon')
            .setEmoji('🔄')
            .setLabel('Restart');
            const stopButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('stop-addon')
            .setEmoji('🔴')
            .setLabel('Stop');

            if(addon.value.restarting === true || addon.value.stopping === true || addon.value.starting === true){
                startButton.setDisabled(true);
                restartButton.setDisabled(true);
                stopButton.setDisabled(true);
            } else if(addon.value.verified === true || addon.value.allowed === true){
                startButton.setDisabled(true);
            } else if(addon.value.verified === false || addon.value.allowed === false){
                stopButton.setDisabled(true);
                restartButton.setDisabled(true);
            }

            const addonActions = new ActionRowBuilder().addComponents(startButton, restartButton, stopButton);

            let statusMessages = {
                'online': messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons.info['status-messages'].online),
                'starting': messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons.info['status-messages'].starting),
                'restarting': messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons.info['status-messages'].restarting),
                'stopping': messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons.info['status-messages'].stopping),
                'offline': messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons.info['status-messages'].offline)
            };

            const permissionsString = getPermissionsString(addon.value.permissions);

            const addonInfo = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons.info.title, [{ADDON_NAME: addon.key}]))
            .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.general.addons.info.message, [{ADDON_NAME: addon.key, ADDON_DESCRIPTION: addon.value.addon.description, ADDON_PERMISSIONS: `* ${permissionsString.join('\n* ')}`}]))
            .setFields(messages.general.addons.info.fields.reduce((arr, item) => {
                let statusMsg = "Unknown status";
                if(addon.value.starting === true){
                    statusMsg = statusMessages.starting;
                } else if(addon.value.restarting === true){
                    statusMsg = statusMessages.restarting;
                } else if(addon.value.stopping === true){
                    statusMsg = statusMessages.stopping;
                } else if(addon.value.allowed === true && addon.value.verified === true){
                    statusMsg = statusMessages.online;
                } else {
                    statusMsg = statusMessages.offline;
                }
                arr.push({
                    name: messageHandler(client, message.member.user, undefined, message.channel, item.name, [{ADDON_STATUS: statusMsg, ADDON_AUTHOR: addon.value.addon.author, ADDON_VERSION: addon.value.addon.version, MANAGER_VERSION: package.dependencies['zyno-bot-addons'].split('^').join('')}]),
                    value: messageHandler(client, message.member.user, undefined, message.channel, item.value, [{ADDON_STATUS: statusMsg, ADDON_AUTHOR: addon.value.addon.author, ADDON_VERSION: addon.value.addon.version, MANAGER_VERSION: package.dependencies['zyno-bot-addons'].split('^').join('')}]),
                    inline: item.inline ?? true
                });
                return arr;
            }, []))
            .setTimestamp();

            new Promise((resolve, reject) => {
                if(edited){
                    sentMsg.edit({embeds: [addonInfo], components: [addonActions, pageActionRow]}).then(resolve).catch(reject);
                } else {
                    sendMessage({embeds: [addonInfo], components: [addonActions, pageActionRow]}).then(resolve).catch(reject);
                }
            }).then(msg => {
                sentMsg = msg;
                const collector = msg.createMessageComponentCollector({
                    filter: i => i.user.id === message.member.id && ['next-page', 'previous-page', 'start-addon', 'restart-addon', 'stop-addon'].indexOf(i.customId) >= 0,
                    max: 1,
                    time: 3*6e4
                });

                collector.on('collect', async i => {
                    i.deferUpdate().catch(err => {});
                    await wait(400);
                    switch(i.customId){
                        case 'next-page':
                            ++page;
                            selectAddon(page, true, false);
                            break;
                        case 'previous-page':
                            --page;
                            selectAddon(page, true, false);
                            break;
                        case 'start-addon':
                            if(client.clientParser.addonRegistar){
                                client.clientParser.addonRegistar.enableAddon(addon.key).catch(console.log);
                                await wait(400);
                                selectAddon(page, true, false);
                            }
                            break;
                        case 'restart-addon':
                            if(client.clientParser.addonRegistar){
                                client.clientParser.addonRegistar.restartAddon(addon.key).catch(console.log);
                                await wait(400);
                                selectAddon(page, true, false);
                            }
                            break;
                        case 'stop-addon':
                            if(client.clientParser.addonRegistar){
                                client.clientParser.addonRegistar.disableAddon(addon.key, true, false).catch(err => {});
                                await wait(400);
                                selectAddon(page, true, false);
                            }
                            break;
                    }
                });

                collector.on('end', collected => {
                    if(collected.size === 0){
                        selectAddon(page, true, true);
                        return;
                    }
                });
            }).catch(console.log);
        }

        selectAddon(1, sentMsg !== null, false);
    }
}
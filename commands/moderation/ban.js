const { EmbedBuilder, PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions');

module.exports = {
    data: {
        name: 'ban',
        description: 'Ban a user from the server',
        category: 'Moderation',
        options: [{type: 6, name: 'user', description: 'The user to ban from the server', required: true}, {type: 3, name: 'reason', description: 'The reason to ban the user', required: false}],
        defaultEnabled: false,
        permissions: 'BanMembers',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);
        
        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.ban['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.ban['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noMember = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.ban['error-messages']['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.ban['error-messages']['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!message.mentions.members.first() && !/^[0-9]*$/.test(args[1])) return sendMessage({embeds: [noMember]}).catch(err => {});
        }

        var member = interaction === false ? (!message.mentions.members.first() ? await client.cache.getMember(args[1], message.guild) : message.mentions.members.first()) : await client.cache.getMember(message.options.getUser('user').id, message.guild);
        if(!member) return sendMessage({embeds: [noMember]}).catch(err => {});

        const unbannable = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban['error-messages']['unbannable'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban['error-messages']['unbannable'].message))
        .setTimestamp();

        if(member.bannable === false) return sendMessage({embeds: [unbannable]}).catch(err => {});

        var reason = handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban['no-reason']);
        if(args[2]){
            reason = args.slice(2).join(" ").split("`").join("").slice(0, 70) + ` | Banned by ${message.member.user.username}`;
        }

        const bannedTime = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban['ban-duration'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban['ban-duration'].message))
        .setTimestamp();
        const optionField = new StringSelectMenuBuilder()
        .setCustomId('ban-duration')
        .setPlaceholder('No duration selected')
        .setOptions([{
            label: messages.moderation.ban['ban-duration'].options.forever,
            description: `Ban ${member.user.username} ${messages.moderation.ban['ban-duration'].options.forever}`,
            value: 'Forever'
        }, {
            label: messages.moderation.ban['ban-duration'].options['30m'],
            description: `Ban ${member.user.username} for ${messages.moderation.ban['ban-duration'].options['30m']}`,
            value: `${30*60*1000}`
        }, {
            label: messages.moderation.ban['ban-duration'].options['1h'],
            description: `Ban ${member.user.username} for ${messages.moderation.ban['ban-duration'].options['1h']}`,
            value: `${60*60*1000}`
        }, {
            label: messages.moderation.ban['ban-duration'].options['2h'],
            description: `Ban ${member.user.username} for ${messages.moderation.ban['ban-duration'].options['2h']}`,
            value: `${2*60*60*1000}`
        }, {
            label: messages.moderation.ban['ban-duration'].options['1d'],
            description: `Ban ${member.user.username} for ${messages.moderation.ban['ban-duration'].options['1d']}`,
            value: `${24*60*60*1000}`
        }, {
            label: messages.moderation.ban['ban-duration'].options['2d'],
            description: `Ban ${member.user.username} for ${messages.moderation.ban['ban-duration'].options['2d']}`,
            value: `${2*24*60*60*1000}`
        }, {
            label: messages.moderation.ban['ban-duration'].options['1w'],
            description: `Ban ${member.user.username} for ${messages.moderation.ban['ban-duration'].options['1w']}`,
            value: `${7*24*60*60*1000}`
        }, {
            label: messages.moderation.ban['ban-duration'].options.cancel,
            value: 'Cancel'
        }]);
        const timeOptionsActionRow = new ActionRowBuilder().addComponents(optionField);
        sendMessage({embeds: [bannedTime], components: [timeOptionsActionRow]}).then(msg => {
            client.interactionInfo.get(`ignore`).set(msg.id, true);
            const timeFilter = i => i.customId === 'ban-duration' && i.user.id === message.member.user.id;
            const timeCollector = msg.createMessageComponentCollector({filter: timeFilter, max: 1, time: 2*60*1000});
            const confirmation = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban.confirm.title))
            .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban.confirm.message, [{REASON: reason}]))
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId('confirm-ban')
            .setStyle(ButtonStyle.Danger)
            .setLabel(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban.confirm['confirm-button']));
            const cancelButton = new ButtonBuilder()
            .setCustomId('cancel-ban')
            .setStyle(ButtonStyle.Secondary)
            .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.ban.confirm['cancel-button']));
            const actionRow = new ActionRowBuilder()
            .setComponents([confirmButton, cancelButton]);

            timeCollector.on('collect', async i => {
                i.deferUpdate({fetchReply: true}).catch(err => {});
                await wait(400);
                client.interactionInfo.get(`ignore`).delete(msg.id);
                const time = i.values[0].toLowerCase();
                var timeString;
                if(time === 'forever'){
                    timeString = 0;
                } else if(time === 'cancel'){
                    msg.delete().catch(err => {});
                    return;
                } else {
                    timeString = parseInt(time);
                }
                msg.edit(client.handleContent(message, {embeds: [confirmation], components: [actionRow]})).then(editedMsg => {
                    const filter = i => (i.customId === 'confirm-ban' || i.customId === 'cancel-ban') && i.user.id === message.member.id;
                    const collector = editedMsg.createMessageComponentCollector({filter: filter, time: 15000, max: 1});
                    collector.on('collect', (btn) => {
                        client.interactionInfo.get(`ignore`).delete(editedMsg.id);
                        if(btn.customId === 'confirm-ban'){
                            message.guild.members.ban(member.id, {reason: reason}).then(async () => {
                                const banned = new EmbedBuilder()
                                .setColor(client.embedColor)
                                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                                .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban.success.title))
                                .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban.success.message, [{GUILD: message.guild.name, REASON: reason}]))
                                .setTimestamp();
                    
                                editedMsg.edit(client.handleContent(message, {embeds: [banned], components: []})).catch(console.log);
                                if(timeString > 0){
                                    var endBan = new Date().getTime() + timeString;
                                    var temporary = client.deepCopy((client.globals.get(`temporaryActions`) || {}));
                                    if(!temporary[message.guild.id]) temporary[message.guild.id] = [];
                                    temporary[message.guild.id].push({
                                        guild: message.guild.id,
                                        member: member.user.id,
                                        time: endBan,
                                        type: 'ban'
                                    });
                                    try{
                                        await client.dbHandler.setValue(`globals`, temporary, {'globalsKey': `temporaryActions`});
                                    } catch {}
                                    client.checkTemporary(message.guild).catch(err => {});
                                }
                            }).catch(err => {
                                console.log(`Error while trying to ban ${member.user.username}: `, err);
                                const failed = new EmbedBuilder()
                                .setColor(`Red`)
                                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                                .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban['error-messages'].error.title))
                                .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.ban['error-messages'].error.message))
                                .setTimestamp();
                    
                                editedMsg.edit(client.handleContent(message, {embeds: [failed], components: []})).catch(err => {});
                            });
                        } else {
                            editedMsg.delete().catch(err => {});
                        }
                    });
                    collector.on('end', collected => {
                        if(collected.size === 0) return editedMsg.delete().catch(err => {});
                    });
                }).catch(err => {});
            });
            timeCollector.on('end', collected => {
                if(collected.size === 0) return msg.delete().catch(err => {});
            });
        }).catch(err => {});
    }
}
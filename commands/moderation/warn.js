const { EmbedBuilder, PermissionsBitField, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions');

module.exports = {
    data: {
        name: 'warn',
        description: 'Warn a user from the server',
        category: 'Moderation',
        options: [{type: 6, name: 'user', description: 'The user to warn from the server', required: true}, {type: 3, name: 'reason', description: 'The reason to warn the user', required: false}],
        defaultEnabled: false,
        permissions: 'ManageMessages',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.warn['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.warn['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noMember = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.warn['error-messages']['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.warn['error-messages']['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!message.mentions.members.first()) return sendMessage({embeds: [noMember]}).catch(err => {});
        }

        var member = interaction === false ? message.mentions.members.first() : await client.cache.getMember(message.options.getUser('user').id, message.guild);
        if(!member) return sendMessage({embeds: [noMember]}).catch(err => {});

        var reason = args[2] ? args.slice(2).join(" ").substring(0, 50) : handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['no-reason']);

        const unwarnable = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['error-messages']['unwarnable'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['error-messages']['unwarnable'].message))
        .setTimestamp();

        if([true, false].indexOf(member.user?.bot) < 0 ? true : member.user?.bot || member.manageable === false) return sendMessage({embeds: [unwarnable]}).catch(err => {});

        const maxWarns = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, message.member, message.channel, messages.moderation.warn['error-messages']['max-warns'].title))
        .setDescription(handleMessage(client, message.member.user, message.member, message.channel, messages.moderation.warn['error-messages']['max-warns'].message))
        .setTimestamp();

        var userWarns = client.deepCopy(client.warns.get(member.id) || []);
        if(userWarns.filter(w => typeof w.guild === 'string' ? w.guild === message.guild.id : true).length >= 10) return sendMessage({embeds: [maxWarns]}).catch(err => {});

        const warnDuration = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['warn-duration'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['warn-duration'].message))
        .setTimestamp();
        const optionField = new StringSelectMenuBuilder()
        .setCustomId('warn-duration')
        .setPlaceholder('No duration selected')
        .setOptions([{
            label: messages.moderation.warn['warn-duration'].options.forever,
            description: `Warn ${member.user.username} ${messages.moderation.warn['warn-duration'].options.forever}`,
            value: 'Forever'
        }, {
            label: `1 minute`,
            description: `Warn ${member.user.username} for 1 minute`,
            value: `${60*1000}`
        }, {
            label: messages.moderation.warn['warn-duration'].options['30m'],
            description: `Warn ${member.user.username} for ${messages.moderation.warn['warn-duration'].options['30m']}`,
            value: `${30*60*1000}`
        }, {
            label: messages.moderation.warn['warn-duration'].options['1h'],
            description: `Warn ${member.user.username} for ${messages.moderation.warn['warn-duration'].options['1h']}`,
            value: `${60*60*1000}`
        }, {
            label: messages.moderation.warn['warn-duration'].options['2h'],
            description: `Warn ${member.user.username} for ${messages.moderation.warn['warn-duration'].options['2h']}`,
            value: `${2*60*60*1000}`
        }, {
            label: messages.moderation.warn['warn-duration'].options['1d'],
            description: `Warn ${member.user.username} for ${messages.moderation.warn['warn-duration'].options['1d']}`,
            value: `${24*60*60*1000}`
        }, {
            label: messages.moderation.warn['warn-duration'].options['2d'],
            description: `Warn ${member.user.username} for ${messages.moderation.warn['warn-duration'].options['2d']}`,
            value: `${2*24*60*60*1000}`
        }, {
            label: messages.moderation.warn['warn-duration'].options['1w'],
            description: `Warn ${member.user.username} for ${messages.moderation.warn['warn-duration'].options['1w']}`,
            value: `${7*24*60*60*1000}`
        }, {
            label: messages.moderation.warn['warn-duration'].options.cancel,
            value: 'Cancel'
        }]);
        const warnDurationActionRow = new ActionRowBuilder().addComponents(optionField);

        sendMessage({embeds: [warnDuration], components: [warnDurationActionRow]}).then(msg => {
            const warnFilter = i => i.user.id === message.member.user.id && i.customId === 'warn-duration';
            const warnCollector = msg.createMessageComponentCollector({filter: warnFilter, max: 1, time: 2*60*1000});

            warnCollector.on('collect', async i => {
                i.deferUpdate().catch(err => {});
                await wait(400);
                const time = i.values[0].toLowerCase();
                var timeValue;
                if(time === 'cancel'){
                    return msg.delete().catch(err => {});
                } else if(time === 'forever'){
                    timeValue = 0;
                } else {
                    timeValue = parseInt(time);
                }

                var timestamp = new Date().getTime()
                try{
                    await client.dbHandler.setValue(`warns`, {warnedBy: message.member.id, reason: reason, warnedAt: timestamp, guild: message.guild.id}, {memberId: member.id, guildId: message.guild.id});
                } catch {}

                const warned = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['success'].title))
                .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['success'].message, [{REASON: reason}]))
                .setTimestamp();

                const warnEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['dm-message'].title))
                .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warn['dm-message'].message, [{GUILD: message.guild.name, REASON: reason}]))
                .setTimestamp();

                if(timeValue > 0){
                    var endWarn = new Date().getTime() + timeValue;
                    var temporary = client.deepCopy((client.globals.get(`temporaryActions`) || {}));
                    if(!temporary[message.guild.id]) temporary[message.guild.id] = [];
                    temporary[message.guild.id].push({
                        guild: message.guild.id,
                        member: member.user.id,
                        time: endWarn,
                        type: 'warn',
                        extra: {
                            warnedAt: timestamp,
                            reason: reason,
                            warnedBy: message.member.id
                        }
                    });
                    try{
                        await client.dbHandler.setValue(`globals`, temporary, {'globalsKey': `temporaryActions`});
                    } catch {}
                }

                client.checkTemporary(message.guild).catch(err => {});

                msg.edit(client.handleContent(message, {embeds: [warned], components: []})).catch(err => {});
                await wait(600);
                member.send(client.handleContent(message, {embeds: [warnEmbed]})).catch(err => {});
            });

            warnCollector.on('end', collected => {
                if(collected.size === 0) return msg.delete().catch(err => {});
            });
        }).catch(err => {});
    }
};
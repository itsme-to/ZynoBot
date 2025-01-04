const { EmbedBuilder, PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions');

module.exports = {
    data: {
        name: 'unban',
        description: 'Unban a user from the server',
        category: 'Moderation',
        options: [{type: 3, name: 'user-id', description: 'The id of the user you would like to unban', required: true}, {type: 3, name: 'reason', description: 'The reason to ban the user', required: false}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unban['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unban['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noMember = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unban['error-messages']['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unban['error-messages']['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!/^[0-9]*$/.test(args[1])) return sendMessage({embeds: [noMember]}).catch(err => {});
        }

        const notBanned = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unban['error-messages']['not-banned'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unban['error-messages']['not-banned'].message))
        .setTimestamp();

        let ban = message.guild.bans.cache.get(args[1]);
        if(!ban){
            return sendMessage({embeds: [notBanned]}).catch(err => {});
        }

        let reason = handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban['no-reason']);
        if(args[2]){
            reason = args.slice(2).join(" ").split("`").join("").slice(0, 70) + ` | Unbanned by ${message.member.user.username}`;
        }
        
        const confirmation = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban.confirm.title))
        .setDescription(handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban.confirm.message, [{REASON: reason}]))
        .setTimestamp();
        const confirmButton = new ButtonBuilder()
        .setCustomId('confirm-unban')
        .setStyle(ButtonStyle.Danger)
        .setLabel(handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban.confirm['confirm-button']));
        const cancelButton = new ButtonBuilder()
        .setCustomId('cancel-unban')
        .setStyle(ButtonStyle.Secondary)
        .setLabel(handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban.confirm['cancel-button']));
        const actionRow = new ActionRowBuilder()
        .setComponents([confirmButton, cancelButton]);

        sendMessage({embeds: [confirmation], components: [actionRow]}).then(msg => {
            client.interactionInfo.get(`ignore`).set(msg.id, true);
            const filter = i => (i.customId === 'confirm-unban' || i.customId === 'cancel-unban') && i.user.id === message.member.id;
            const collector = msg.createMessageComponentCollector({filter: filter, time: 15000, max: 1});
            collector.on('collect', (btn) => {
                client.interactionInfo.get(`ignore`).delete(msg.id);
                if(btn.customId === 'confirm-unban'){
                    message.guild.bans.remove(args[1], {reason: reason}).then(async () => {
                        const banned = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                        .setTitle(handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban.success.title))
                        .setDescription(handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban.success.message, [{GUILD: message.guild.name, REASON: reason}]))
                        .setTimestamp();
            
                        msg.edit(client.handleContent(message, {embeds: [banned], components: []})).catch(err => {});
                    }).catch(err => {
                        console.log(`Error while trying to unban ${ban.user.username}: `, err);
                        const failed = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                        .setTitle(handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban['error-messages'].error.title))
                        .setDescription(handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.unban['error-messages'].error.message))
                        .setTimestamp();
            
                        msg.edit(client.handleContent(message, {embeds: [failed], components: []})).catch(err => {});
                    });
                } else {
                    msg.delete().catch(err => {});
                }
            });
            collector.on('end', collected => {
                if(collected.size === 0) return msg.delete().catch(err => {});
            });
        }).catch(err => {});
    }
}
const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'kick',
        description: 'Kick a user from the server',
        category: 'Moderation',
        options: [{type: 6, name: 'user', description: 'The user to kick from the server', required: true}, {type: 3, name: 'reason', description: 'The reason to kick the user', required: false}],
        defaultEnabled: false,
        permissions: 'KickMembers',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.kick['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.kick['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noMember = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.kick['error-messages']['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.kick['error-messages']['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!message.mentions.members.first() && !/^[0-9]*$/.test(args[1])) return sendMessage({embeds: [noMember]}).catch(err => {});
        }

        var member = interaction === false ? (!message.mentions.members.first() ? await client.cache.getMember(args[1], message.guild) : message.mentions.members.first()) : await client.cache.getMember(message.options.getUser('user').id, message.guild);
        if(!member) return sendMessage({embeds: [noMember]}).catch(err => {});

        const unkickable = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick['error-messages']['unkickable'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick['error-messages']['unkickable'].message))
        .setTimestamp();

        if(member.kickable === false) return sendMessage({embeds: [unkickable]}).catch(err => {});

        var reason = handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick['no-reason']);
        if(args[2]){
            reason = args.slice(2).join(" ").split("`").join("").slice(0, 70) + ` | Kicked by ${message.member.user.username}`;
        }

        const confirmation = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick.confirm.title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick.confirm.message, [{REASON: reason}]))
        .setTimestamp();
        const confirmButton = new ButtonBuilder()
        .setCustomId('confirm-kick')
        .setStyle(ButtonStyle.Danger)
        .setLabel(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick.confirm['confirm-button']));
        const cancelButton = new ButtonBuilder()
        .setCustomId('cancel-kick')
        .setStyle(ButtonStyle.Secondary)
        .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.kick.confirm['cancel-button']));
        const actionRow = new ActionRowBuilder()
        .setComponents([confirmButton, cancelButton]);

        sendMessage({embeds: [confirmation], components: [actionRow]}).then(msg => {
            client.interactionInfo.get(`ignore`).set(msg.id, true);
            const filter = i => (i.customId === 'confirm-kick' || i.customId === 'cancel-kick') && i.user.id === message.member.id;
            const collector = msg.createMessageComponentCollector({filter: filter, time: 15000, max: 1});
            collector.on('collect', (btn) => {
                if(btn.customId === 'confirm-kick'){
                    message.guild.members.kick(member.id, reason).then(() => {
                        const kicked = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick.success.title))
                        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick.success.message, [{GUILD: message.guild.name, REASON: reason}]))
                        .setTimestamp();
            
                        msg.edit(client.handleContent(message, {embeds: [kicked], components: []})).catch(err => {});
                    }).catch(err => {
                        console.log(`Error while trying to kick ${member.user.username}: `, err);
                        const failed = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick['error-messages'].error.title))
                        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.kick['error-messages'].error.message))
                        .setTimestamp();
            
                        msg.edit(client.handleContent(message, {embeds: [failed], components: []})).catch(err => {});
                    });
                } else {
                    msg.delete().catch(err => {});
                }
            });
            collector.on('end', () => {
                client.interactionInfo.get(`ignore`).delete(msg.id);
                if(collector.collected.size === 0) return msg.delete().catch(err => {});
            });
        }).catch(err => {});
    }
}
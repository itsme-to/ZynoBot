const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'unwarn',
        description: 'Unwarn a user from the server',
        category: 'Moderation',
        options: [{type: 6, name: 'user', description: 'The user you want to unwarn', required: true}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unwarn['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unwarn['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noMember = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unwarn['error-messages']['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.unwarn['error-messages']['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!message.mentions.members.first()) return sendMessage({embeds: [noMember]}).catch(err => {});
        }

        var member = interaction === false ? message.mentions.members.first() : await client.cache.getMember(message.options.getUser('user').id, message.guild);
        if(!member) return sendMessage({embeds: [noMember]}).catch(err => {});

        var warns = client.deepCopy(client.warns.get(member.id) || []).filter(w => typeof w.guild === 'string' ? w.guild === message.guild.id : true);

        const noWarns = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unwarn['error-messages']['no-warnings'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unwarn['error-messages']['no-warnings'].message))
        .setTimestamp();

        const interactionInfo = client.interactionInfo.get(`unwarn`);

        if(warns.length === 0) return sendMessage({embeds: [noWarns]}).catch(err => {});

        const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`unwarn-select`)
        .setPlaceholder(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unwarn.menu.placeholder))
        .setOptions(warns.reduce((arr, warn, index) => {
            var warner = client.users.cache.get(warn.warnedBy);
            var warnedAt = warn.warnedAt ? new Date(warn.warnedAt) : null;
            arr.push({
                label: handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unwarn.menu.label, [{NUMBER: `[${index + 1}]`, REASON: warn.reason}]),
                value: String(index),
                description: handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unwarn['menu'].select, [{WARNER: warner ? warner.username : messages.moderation.unwarn.menu['unknown-warner'], DATE: warnedAt ? `${warnedAt.getDate()}/${(warnedAt.getMonth() + 1)}/${warnedAt.getFullYear()} at ${warnedAt.getHours()}:${warnedAt.getMinutes()}` : messages.moderation.unwarn.menu['unknown-date']}])
            });
            return arr;
        }, []));
        const actionRow = new ActionRowBuilder()
        .addComponents(selectMenu);
        const unwarnEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unwarn.menu.title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.unwarn.menu.message))
        .setTimestamp();

        sendMessage({embeds: [unwarnEmbed], components: [actionRow]}).then(msg => {
            interactionInfo.set(msg.id, {userId: message.member.id, unwarnUser: member.id});
        }).catch(console.log);
    }
};
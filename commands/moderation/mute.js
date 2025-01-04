const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'mute',
        description: 'Mute a user from the server',
        category: 'Moderation',
        options: [{type: 6, name: 'user', description: 'The user to mute from the server', required: true}, {type: 3, name: 'reason', description: 'The reason to mute the user', required: false}],
        defaultEnabled: false,
        permissions: 'ModerateMembers',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noMember = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['error-messages']['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['error-messages']['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!message.mentions.members.first()) return sendMessage({embeds: [noMember]}).catch(err => {});
        }

        var member = interaction === false ? message.mentions.members.first() : await client.cache.getMember(message.options.getUser('user').id, message.guild);
        if(!member) return sendMessage({embeds: [noMember]}).catch(err => {});

        const unmuteable = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.mute['error-messages']['unmuteable'].title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.mute['error-messages']['unmuteable'].message))
        .setTimestamp();

        if(member.moderatable === false) return sendMessage({embeds: [unmuteable]}).catch(err => {});

        var reason = handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.mute['no-reason']);
        if(args[2]){
            reason = args.slice(2).join(" ").split("`").join("");
        }

        const timeOptions = [{string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['1-minute']), value: 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['5-minutes']), value: 5 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['10-minutes']), value: 10 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['1-hour']), value: 60 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['2-hour']), value: 2 * 60 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['5-hour']), value: 5 * 60 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['1-day']), value: 24 * 60 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['2-day']), value: 2 * 24 * 60 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['4-day']), value: 4 * 24 * 60 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['5-day']), value: 5 * 24 * 60 * 60 * 1000}, {string: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['1-week']), value: 7 * 24 * 60 * 60 * 1000}];
        const options = timeOptions.reduce((arr, time) => {
            arr.push({
                label: time.string,
                value: String(time.value),
                description: handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.mute['mute-options']['time-text'], [{TIME: time.string}])
            });
            return arr;
        }, [{
            label: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['cancel-label']),
            value: String(0),
            description: handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.mute['mute-options']['cancel-option'])
        }]);


        const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('mute')
        .setPlaceholder(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.mute.menu.placeholder))
        .setOptions([...options]);
        const actionRow = new ActionRowBuilder()
        .addComponents(selectMenu);
        const muteEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.mute.menu.title))
        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.mute.menu.message))
        .setTimestamp();

        sendMessage({embeds: [muteEmbed], components: [actionRow]}).then(msg => {
            client.interactionInfo.get('mute').set(msg.id, {member: member.id, reason: reason, moderator: message.member.id, time: timeOptions});
        }).catch(err => {});
    }
}
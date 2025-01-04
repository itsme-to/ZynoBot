const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'warns',
        description: 'Get the warns of a user from the server',
        category: 'Moderation',
        options: [{type: 6, name: 'user', description: 'The user you want to see the warns of', required: true}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.warns['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.warns['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noMember = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.warns['error-messages']['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.warns['error-messages']['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!message.mentions.members.first()) return sendMessage({embeds: [noMember]}).catch(err => {});
        }

        var member = (interaction === false ? message.mentions.members.first() : await client.cache.getMember(message.options.getUser('user').id, message.guild)) || {tag: 'Unknown', username: 'Unknown', id: 'Unknown'};;

        var warns = client.deepCopy(client.warns.get(member.id) || []).filter(w => typeof w.guild === 'string' ? w.guild === message.guild.id : true);

        var warnTXT = '';

        if(warns.length > 0){
            warnTXT = "**Warns:**\n```";
            for(var i = 0; i < warns.length; i++){
                var item = warns[i];
                var warnedBy = await client.cache.getUser(item.warnedBy) || {tag: 'Unknown', username: 'Unknown', id: 'Unknown'};
                var warning = handleMessage(client, warnedBy, member.user, message.channel, messages.moderation.warns.warn, [{NUMBER: `${i + 1}`, REASON: item.reason}]);
                warnTXT += `\n${warning}`;
            }
            warnTXT += "```"
        } else {
            warnTXT = `**Warns:**\n${handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warns['no-warns-text'])}`;
        }

        const warnsEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.warns.title))
        .setDescription(warnTXT)
        .setTimestamp();

        sendMessage({embeds: [warnsEmbed]}).catch(err => {});
    }
};
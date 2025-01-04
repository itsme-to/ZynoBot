const { EmbedBuilder } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'invites',
        description: 'See your or someone else his/her invites',
        category: 'Level',
        options: [{type: 6, name: 'user', description: 'The user where you want to see their invites from', required: false}],
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        var user;
        if(interaction === false) user = message.mentions.members.first() ? message.mentions.members.first().user : message.member.user;
        else user = message.options.getUser(`user`) ? message.options.getUser(`user`) : message.member.user;

        let userInfo = client.deepCopy(client.userinfo.get(user.id) || [{joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: message.guild.id}]).filter(u => u.guild === message.guild.id)[0] || {joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: message.guild.id};

        if(typeof userInfo.invites !== 'number' || typeof userInfo.inviteleaves !== 'number'){
            userInfo.invites = userInfo.invites || 0;
            userInfo.inviteleaves = userInfo.inviteleaves || 0;
        }

        const messagesEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.general.invites.title))
        .setFields([{
            inline: true,
            name: 'Invites',
            value: handleMessage(client, message.member.user, user, message.channel, messages.general.invites.fields[0], [{INVITES: userInfo.invites}])
        }, {
            inline: true,
            name: 'Leaves',
            value: handleMessage(client, message.member.user, user, message.channel, messages.general.invites.fields[1], [{INVITELEAVES: userInfo.inviteleaves}])
        }, {
            inline: true,
            name: 'Total',
            value: handleMessage(client, message.member.user, user, message.channel, messages.general.invites.fields[2], [{TOTALINVITES: (userInfo.invites - userInfo.inviteleaves)}])
        }])
        .setTimestamp();

        sendMessage({embeds: [messagesEmbed]}).catch(err => {});
    }
}
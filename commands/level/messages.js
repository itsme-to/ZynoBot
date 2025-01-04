const { EmbedBuilder } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'messages',
        description: 'See your or someone else his/her messages',
        category: 'Level',
        options: [{type: 6, name: 'user', description: 'The user where you want to see their messages from', required: false}],
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        var user;
        if(interaction === false) user = message.mentions.members.first() ? message.mentions.members.first().user : message.member.user;
        else user = message.options.getUser(`user`) ? message.options.getUser(`user`) : message.member.user;

        var xp = client.deepCopy(client.xp.get(user.id) || [{messages: 0, level: 0, xp: 0, guild: message.guild.id}]).filter(e => e.guild === message.guild.id)[0] || {messages: 0, level: 0, xp: 0, guild: message.guild.id};

        const messagesEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.level["user-messages"].title))
        .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.level["user-messages"].message, [{MESSAGES: xp.messages}]))
        .setTimestamp();

        sendMessage({embeds: [messagesEmbed]}).catch(err => {});
    }
}
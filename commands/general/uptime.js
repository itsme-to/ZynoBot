const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'uptime',
        description: 'See how long the bot has been online',
        category: 'General',
        options: [],
        defaultEnabled: true,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const onlineEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general['uptime'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general['uptime'].message, [{TIMESTAMP: Math.round(client.onlineAt.getTime() / 1000)}]))
        .setTimestamp();

        sendMessage({embeds: [onlineEmbed]}).catch(err => {});
    }
}
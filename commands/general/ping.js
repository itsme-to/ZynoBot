const { EmbedBuilder } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");

module.exports = {
    data: {
        name: 'ping',
        description: 'See the ping between the server and the bot',
        options: [],
        category: 'General',
        defaultEnabled: true,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const loading = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.ping.loading.title))
        .setDescription((handleMessage(client, message.member.user, undefined, message.channel, messages.general.ping.loading.message)))
        .setTimestamp();

        const sendTimestamp = new Date().getTime();

        sendMessage({embeds: [loading]}).then(msg => {
            var replyMessage = client.replyMessage(message, false, msg);

            var apiLatency = (msg.createdTimestamp - sendTimestamp).toString().length > 3 ? `${((msg.createdTimestamp - sendTimestamp) / 1000)} s` : `${(msg.createdTimestamp - sendTimestamp)} ms`;
            
            const pingEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.ping.ping.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.ping.ping.message, [{BOT_LATENCY: `${client.ws.ping} ms`, DISCORD_API_LATENCY: apiLatency}]))
            .setTimestamp();

            replyMessage({embeds: [pingEmbed]}).catch(err => {});

        }).catch(err => {});
    }
}
const { EmbedBuilder } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");

module.exports = {
    data: {
        name: 'mcip',
        description: "Get the Minecraft server's ip",
        options: [],
        category: 'Games',
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const disabledEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.disabled.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.disabled.message))
        .setTimestamp();

        if(typeof client.config.minecraft[message.guild.id].server !== 'string') return sendMessage({embeds: [disabledEmbed]}).catch(err => {});

        const ipEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.ip.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.ip.message, [{MINECRAFT_SERVER_IP: client.config.minecraft[message.guild.id].server}]))
        .setTimestamp();

        sendMessage({embeds: [ipEmbed]}).catch(err => {});
    }
}
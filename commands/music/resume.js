const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'resume',
        description: 'Start playing the song again',
        category: 'Music',
        options: [],
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noVC = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].message))
        .setTimestamp();

        if(!message.guild.members.me.voice.channel) return sendMessage({embeds: [noVC]}).catch(err => {});
        if(!client.playing.get(message.guild.members.me.voice.channel.id)) return sendMessage({embeds: [noVC]}).catch(err => {});

        const resume = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['resume-embed'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['resume-embed'].message))
        .setTimestamp();

        client.audioManager.resume(message.guild.members.me.voice.channel);
        sendMessage({embeds: [resume]}).catch(err => {});
    }
}
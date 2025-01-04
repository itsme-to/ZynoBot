const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions.js');

module.exports = {
    data: {
        name: 'previous',
        description: 'Play the previous song again',
        category: 'Music',
        options: [],
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noVC = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].message))
        .setTimestamp();

        if(!message.guild.members.me.voice.channel) return sendMessage({embeds: [noVC]}).catch(err => {});
        if(!client.playing.get(message.guild.members.me.voice.channel.id)) return sendMessage({embeds: [noVC]}).catch(err => {});

        if(interaction){
            message.deferReply().catch(err => {});
            await wait(400);
        }

        const failed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['previous-embeds'].error.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['previous-embeds'].error.message))
        .setTimestamp();

        client.audioManager.previous(message.guild.members.me.voice.channel).then(() => {

            const song = client.audioManager.queue(message.guild.members.me.voice.channel)[0];

            const previous = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['previous-embeds'].success.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['previous-embeds'].success.message, [{SONG: song.title ? `[${song.title}](${song.url})` : handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['previous-embeds']['a-song-text'], [{URL: song.url}])}]))
            .setTimestamp();

            if(!interaction) sendMessage({embeds: [previous]}).catch(err => {});
            else message.editReply({embeds: [previous]}).catch(err => {});
        }).catch(err => {
            console.log(`Error while playing previous song: `, `${err}`);
            if(!interaction) sendMessage({embeds: [failed]}).catch(err => {});
            else message.editReply({embeds: [failed]}).catch(err => {});
        });
    }
}
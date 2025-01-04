const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions.js');

module.exports = {
    data: {
        name: 'skip',
        description: 'Skip a song',
        category: 'Music',
        options: [],
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        if(interaction === true){
            message.deferReply().catch(err => {});
            await wait(4e2);
        }

        const noVC = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].message))
        .setTimestamp();

        if(!message.guild.members.me.voice.channel) return sendMessage({embeds: [noVC]}).catch(err => {});
        if(!client.playing.get(message.guild.members.me.voice.channel.id)) return sendMessage({embeds: [noVC]}).catch(err => {});

        const song = client.audioManager.queue(message.guild.members.me.voice.channel)[0];

        const skip = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['skip-embeds'].success.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['skip-embeds'].success.message, [{SONG: song.title ? `[${song.title}](${song.url})` : handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['skip-embeds']['a-song-text'], [{URL: song.url}])}]))
        .setTimestamp();
        const failed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['skip-embeds'].error.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['skip-embeds'].error.message, [{SONG: song.title ? `[${song.title}](${song.url})` : handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['skip-embeds']['a-song-text'].toLowerCase(), [{URL: song.url}])}]))
        .setTimestamp();

        client.audioManager.skip(message.guild.members.me.voice.channel).then(() => {
            if(!interaction) sendMessage({embeds: [skip]}).catch(err => {});
            else message.editReply({embeds: [skip]}).catch(err => {});
        }).catch(err => {
            console.log(`Error while skipping song: `, `${err}`);
            if(!interaction) sendMessage({embeds: [failed]}).catch(err => {});
            else message.editReply({embeds: [failed]}).catch(err => {});
        });
    }
}
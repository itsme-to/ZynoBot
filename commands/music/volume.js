const { EmbedBuilder } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'volume',
        description: 'Change the volume of the song',
        options: [{type: 4, name: 'volume', description: 'The volume of the song', required: true}],
        category: 'Music',
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const ffmpegNotInstalled = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['ffmpeg-not-installed'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['ffmpeg-not-installed'].message))
        .setTimestamp();

        if(client.ffmpeg === false || client.config.ffmpeg === false) return sendMessage({embeds: [ffmpegNotInstalled]}).catch(err => {});
        
        const noVC = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].message))
        .setTimestamp();

        if(!message.guild.members.me.voice.channel) return sendMessage({embeds: [noVC]}).catch(err => {});
        if(!client.playing.get(message.guild.members.me.voice.channel.id)) return sendMessage({embeds: [noVC]}).catch(err => {});

        const noVolume = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages["music-cmds"]["volume-embeds"]["no-volume-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages["music-cmds"]["volume-embeds"]["no-volume-provided"].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noVolume]}).catch(err => {});

        const invalidVolume = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages["music-cmds"]["volume-embeds"]["invalid-volume"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages["music-cmds"]["volume-embeds"]["invalid-volume"].message))
        .setTimestamp();

        var volume = args[1];
        if(!Number(volume))  return sendMessage({embeds: [invalidVolume]}).catch(err => {});

        var volume = Number(args[1]);
        if(volume < 1) volume = 1;
        else if(volume > 10) volume = 10;

        client.audioManager.volume(message.guild.members.me.voice.channel, volume);
        
        const success = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages["music-cmds"]["volume-embeds"]["volume-changed"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages["music-cmds"]["volume-embeds"]["volume-changed"].message, [{VOLUME: volume}]))
        .setTimestamp();

        sendMessage({embeds: [success]}).catch(err => {});
    }
};
const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

function firstLetterUppercase(string){
    var firstLetter = string.slice(0, 1);
    var newString = firstLetter.toUpperCase() + string.slice(1, string.length);
    return newString;
}

const filters = {
    'bassboost': 'bass=g=10',
    'vibrato': 'vibrato=f=6.5',
    'surrounding': 'surround',
    '8D': 'apulsator=hz=0.08',
    'tremolo': 'tremolo',
    'earrape': 'superequalizer=1b=20:2b=20:3b=20:4b=20:5b=20:6b=20:7b=20:8b=20:9b=20:10b=20:11b=20:12b=20:13b=20:14b=20:15b=20:16b=20:17b=20:18b=20,channelsplit,sidechaingate=level_in=64',
    'speedup': 'atempo=1.5',
    'slowdown': 'atempo=0.7',
    'karaoke': 'pan=stereo|c0=c0|c1=-1*c1',
    '3D': 'chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3',
    'nightcore': 'aresample=48000,asetrate=48000*1.25',
    'vaporwave': 'aresample=48000,asetrate=48000*0.8',
    'reset': 'reset'
};

module.exports = {
    data: {
        name: 'filter',
        description: 'Sets or removes a filter for the music',
        options: [{type: 3, name: 'filter', description: 'The filter you\'d like to set or remove', choices: Object.keys(filters).map(o => {
            return {
                name: firstLetterUppercase(o),
                value: o.toLowerCase()
            }
        }), required: true}],
        category: 'Music',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
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

        const noFilterProvided = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true, size: 256})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['no-filter-provided'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['no-filter-provided'].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noFilterProvided]}).catch(err => {});

        const invalidFilter = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true, size: 256})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['invalid-filter'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['invalid-filter'].message))
        .setTimestamp();

        const filterKeys = Object.keys(filters).map(o => o.toLowerCase());
        if(filterKeys.indexOf(args[1].toLowerCase()) < 0) return sendMessage({embeds: [invalidFilter]}).catch(err => {});

        const filterValues = Object.values(filters);

        const indexKeyFilter = filterKeys.indexOf(args[1].toLowerCase());
        const filter = filterValues[indexKeyFilter];
        
        const setFilters = client.audioManager.getFilters(message.guild.members.me.voice.channel);

        const handleEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true, size: 256})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters.handle.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters.handle.message))
        .setTimestamp();

        let msg = undefined;
        try{
            msg = await sendMessage({embeds: [handleEmbed]});
        } catch {}

        const applied = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true, size: 256})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['filter-applied'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['filter-applied'].message))
        .setTimestamp();

        const error = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true, size: 256})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['failed-change'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds'].filters['failed-change'].message))
        .setTimestamp();

        if(filter === 'reset'){
            try{
                await client.audioManager.removeFilter(message.guild.members.me.voice.channel, ...setFilters);
                if(!msg) return sendMessage({embeds: [applied]}).catch(err => {});
                else msg.edit({embeds: [applied]}).catch(err => {});
            } catch(err) {
                console.log(err);
                if(!msg) return sendMessage({embeds: [error]}).catch(err => {});
                else msg.edit({embeds: [error]}).catch(err => {});
                return;
            }
        } else if(setFilters.indexOf(filter) < 0){
            try{
                if(args[1].toLowerCase() === "speedup" && setFilters.indexOf(filters['slowdown']) >= 0){
                    await client.audioManager.removeFilter(message.guild.members.me.voice.channel, filters['slowdown']);
                } else if(args[1].toLowerCase() === "slowdown" && setFilters.indexOf(filters['speedup']) >= 0){
                    await client.audioManager.removeFilter(message.guild.members.me.voice.channel, filters['slowdown']);
                }
                if(args[1].toLowerCase() === "nightcore" && setFilters.indexOf(filters['vaporwave']) >= 0){
                    await client.audioManager.removeFilter(message.guild.members.me.voice.channel, filters['vaporwave']);
                } else if(args[1].toLowerCase() === "vaporwave" && setFilters.indexOf(filters['nightcore']) >= 0){
                    await client.audioManager.removeFilter(message.guild.members.me.voice.channel, filters['nightcore']);
                }
                await client.audioManager.setFilter(message.guild.members.me.voice.channel, filter);
                if(!msg) return sendMessage({embeds: [applied]}).catch(err => {});
                else msg.edit({embeds: [applied]}).catch(err => {});
            } catch(err) {
                console.log(err);
                if(!msg) return sendMessage({embeds: [error]}).catch(err => {});
                else msg.edit({embeds: [error]}).catch(err => {});
                return;
            }
        } else {
            try{
                await client.audioManager.removeFilter(message.guild.members.me.voice.channel, filter);
                if(!msg) return sendMessage({embeds: [applied]}).catch(err => {});
                else msg.edit({embeds: [applied]}).catch(err => {});
            } catch(err) {
                console.log(err);
                if(!msg) return sendMessage({embeds: [error]}).catch(err => {});
                else msg.edit({embeds: [error]}).catch(err => {});
                return;
            }
        }
    }
}
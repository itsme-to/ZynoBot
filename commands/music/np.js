const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions.js');

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

const adjustedSpeeds = {
    'speedup': 1.5,
    'slowdown': 0.7,
    'nightcore': 1.25,
    'vaporwave': 0.8
};

module.exports = {
    data: {
        name: 'np',
        description: 'See which song is playing now',
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

        function genMsg(msg, ended){
            if(!message.guild.members.me.voice.channel){
                msg.edit({embeds: [...msg.embeds.map(e => EmbedBuilder.from(e))], components: []}).catch(err => {});
                return;
            }
            const getSongInformation = client.audioManager.getCurrentSong(message.guild.members.me.voice.channel);
            const getVolume = client.audioManager.getVolume(message.guild.members.me.voice.channel);
            const queueInfo = client.audioManager.queue(message.guild.members.me.voice.channel);

            const volumePercentage = `${getVolume / 10 * 100}%`;
            const endTime = getSongInformation.info ? ((getSongInformation.info?.duration ?? getSongInformation.info?.length) + getSongInformation.started) : 1;
            const currentTimestamp = (new Date()).getTime();
            let missedTimes = getSongInformation.pauses.reduce((time, item) => {
                if(!item.ended){
                    time += (currentTimestamp - item.started);
                } else {
                    time += (item.ended - item.started);
                }
                return time;
            }, 0);

            let differenceTime = currentTimestamp - getSongInformation.started - missedTimes;

            const filterValues = Object.values(filters);
            const filterKeys = Object.keys(filters);

            let filterText = [];

            const appliedFilters = client.audioManager.getFilters(message.guild.members.me.voice.channel);
            for(const filter of appliedFilters){
                let filterIndex = filterValues.indexOf(filter);
                if(filterIndex >= 0){
                    const filterName = filterKeys[filterIndex];
                    const adjustedSpeed = adjustedSpeeds[filterName] ?? 1;
                    filterText.push(firstLetterUppercase(filterName));
                    differenceTime *= adjustedSpeed;
                }
            }

            filterText = filterText.length > 0 ? filterText.join(', ') : 'None';

            const timePercentage = differenceTime / (endTime - getSongInformation.started);

            let songProgress = "";

            differenceTime = Math.round(differenceTime / 1000);

            for(let i = 2; i >= 0; i--){
                let receivedTime = Math.floor(differenceTime / (60**i));
                let receivedTimeString = receivedTime.toString();
                if(receivedTime <= 0 && songProgress.length === 0 && i > 1) continue;
                songProgress = songProgress + (receivedTimeString.length < 2 ? `0${receivedTimeString}` : receivedTimeString) + (i > 0 ? `:` : ``);
                differenceTime = differenceTime - (receivedTime * 60**i);
            }

            songProgress += " ";

            for(let i = 0; i < Math.round(timePercentage * 20); i++){
                songProgress += "─";
            }
            songProgress += "⚪";
            for(let i = 0; i < (20 - Math.round(timePercentage * 20)); i++){
                songProgress += "─";
            }

            let durationSeconds = getSongInformation.info ? Math.round((getSongInformation.info?.duration ?? getSongInformation.info?.length) / 1000) : 0;
            let time = ``;
            for(let i = 2; i >= 0; i--){
                let receivedTime = Math.floor(durationSeconds / (60**i));
                let receivedTimeString = receivedTime.toString();
                if(receivedTime <= 0 && time.length === 0 && i > 1) continue;
                time = time + (receivedTimeString.length < 2 ? `0${receivedTimeString}` : receivedTimeString) + (i > 0 ? `:` : ``);
                durationSeconds = durationSeconds - (receivedTime * 60**i);
            }

            songProgress += " "+time;

            songProgress = `\`${songProgress}\``;

            let loopStatus = "";
            switch(getSongInformation.loop){
                case client.audioManager.looptypes.off:
                    loopStatus = handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['now-playing'].loop.disabled);
                    break;
                case client.audioManager.looptypes.loop:
                    loopStatus = handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['now-playing'].loop['song-loop']);
                    break;  
                case client.audioManager.looptypes.queueloop:
                    loopStatus = handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['now-playing'].loop['queue-loop']);
                    break;
            }

            let pauseStatus = getSongInformation.paused ? handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['now-playing'].paused.yes) : handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['now-playing'].paused.no);

            const nowPlaying = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['now-playing'].title, [{TITLE: getSongInformation.title ?? getSongInformation.url.slice(0, 20), URL: getSongInformation.url}]))
            .setURL(getSongInformation.url)
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['now-playing'].message, [{LENGTH: time, QUEUE: queueInfo.length, VOLUME: volumePercentage, PROGRESS_BAR: songProgress}]))
            .setFields((messages['music-cmds']['now-playing'].fields || []).reduce((arr, item) => {
                arr.push({
                    inline: item.inline,
                    name: handleMessage(client, message.member.user, undefined, message.channel, item.name, [{LENGTH: time, QUEUE: queueInfo.length, VOLUME: volumePercentage, PROGRESS_BAR: songProgress, LOOP: loopStatus, FILTERS: filterText, PAUSED: pauseStatus}]),
                    value: handleMessage(client, message.member.user, undefined, message.channel, item.value, [{LENGTH: time, QUEUE: queueInfo.length, VOLUME: volumePercentage, PROGRESS_BAR: songProgress, LOOP: loopStatus, FILTERS: filterText, PAUSED: pauseStatus}])
                });
                return arr;
            }, []))
            .setTimestamp();

            if(getSongInformation.info){
                nowPlaying.setThumbnail(getSongInformation.info?.default_thumbnail?.url ?? getSongInformation.info?.thumbnail);
            }

            const previousBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel('⏮️')
            .setDisabled(ended)
            .setCustomId('music-previous-btn');
            const stop = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel('⏹️')
            .setDisabled(ended)
            .setCustomId('music-stop-btn');
            const playPauseBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel('⏯️')
            .setDisabled(ended)
            .setCustomId('music-play-pause-btn');
            const nextBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel('⏭️')
            .setDisabled(ended)
            .setCustomId('music-next-btn');
            const loopBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel('🔁')
            .setDisabled(ended)
            .setCustomId('music-loop-btn');

            const buttonsActionRow = new ActionRowBuilder()
            .addComponents(previousBtn, stop, playPauseBtn, nextBtn, loopBtn);

            new Promise((resolve, reject) => {
                if(!msg) sendMessage({embeds: [nowPlaying], components: [buttonsActionRow]}).then(resolve).catch(reject);
                else msg.edit(client.handleContent(message, {embeds: [nowPlaying], components: [buttonsActionRow]})).then(resolve).catch(reject);
            }).then(_msg => {
                if(ended) return;
                const collector = _msg.createMessageComponentCollector({
                    filter: i => i.member.id === message.member.id && ['music-previous-btn', 'music-stop-btn', 'music-play-pause-btn', 'music-next-btn', 'music-loop-btn'].indexOf(i.customId) >= 0,
                    max: 1,
                    time: 3*6e4
                });
                
                collector.on('collect', async i => {
                    i.deferUpdate().catch(err => {});
                    if(!i.guild.members.me.voice.channel) return i.message.edit({embeds: [noVC], components: []}).catch(err => {});
                    await wait(4e2);
                    let songStatus = client.audioManager.getCurrentSong(i.guild.members.me.voice.channel);
                    switch(i.customId){
                        case 'music-previous-btn':
                            client.audioManager.previous(i.guild.members.me.voice.channel).catch(err => {});
                            await wait(4e2);

                            genMsg(_msg, false);
                            
                            break;
                        case 'music-stop-btn':
                            client.audioManager.stop(i.guild.members.me.voice.channel).catch(err => {});
                            await wait(4e2);

                            const stopped = new EmbedBuilder()
                            .setColor(client.embedColor)
                            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                            .setTitle(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['stop-embed'].title))
                            .setDescription(handleMessage(client, message.member.user, undefined, message.guild.members.me.voice.channel, messages['music-cmds']['stop-embed'].message))
                            .setTimestamp();

                            i.message.edit({embeds: [stopped], components: []}).catch(err => {});
                            break;
                        case 'music-play-pause-btn':
                            if(songStatus.paused){
                                client.audioManager.resume(i.guild.members.me.voice.channel);
                            } else {
                                client.audioManager.pause(i.guild.members.me.voice.channel);
                            }

                            await wait(4e2);

                            genMsg(_msg, false);
                            break;
                        case 'music-next-btn':
                            client.audioManager.skip(i.guild.members.me.voice.channel).catch(err => {});
                            await wait(4e2);

                            genMsg(_msg, false);
                            break;
                        case 'music-loop-btn':
                            if(songStatus.loop === client.audioManager.looptypes.loop || songStatus.loop === client.audioManager.looptypes.queueloop){
                                client.audioManager.loop(i.guild.members.me.voice.channel, client.audioManager.looptypes.off);
                            } else {
                                client.audioManager.loop(i.guild.members.me.voice.channel, client.audioManager.looptypes.loop);
                            }

                            await wait(4e2);
                            
                            genMsg(_msg, false);
                            break;
                    }
                });

                collector.on('end', (collected) => {
                    if(collected.size === 0){
                        genMsg(_msg, true);
                    } else return;
                });
            }).catch(err => {});
        }

        genMsg(undefined, false);
    }
}
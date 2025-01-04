const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const ValueSaver = require('valuesaver');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions.js');
const ytstream = require('yt-stream');
const soundcloud = require('sc-play');

module.exports = {
    data: {
        name: 'queue',
        description: 'Shows the whole queue',
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

        var actionRow = undefined;

        var vcQueue = client.audioManager.queue(message.guild.members.me.voice.channel);

        var currentPage = 1;

        function getQueueMessage(page, end){
            if(message.guild.members.me.voice.channel) vcQueue = client.audioManager.queue(message.guild.members.me.voice.channel);
            if(vcQueue.length > 25){
                const previousPageButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId(`previous-page`)
                .setLabel(`◀️`);
                if(currentPage <= 1 || end === true){
                    previousPageButton.setDisabled(true);
                }
                const currentPageButtons = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`page-button`)
                .setDisabled(true)
                .setLabel(`Page ${page}/${Math.ceil(vcQueue.length / 25)}`);
                const nextPageButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId(`next-page`)
                .setLabel(`▶️`);
                if(vcQueue.length < page * 25 || end === true){
                    nextPageButton.setDisabled(true);
                }
                actionRow = [new ActionRowBuilder().addComponents(previousPageButton, currentPageButtons, nextPageButton)];
            }

            var queue = ``;
            var maxIndex = vcQueue.length > page * 25 ? page * 25 : vcQueue.length;
            for(var i = (page - 1) * 25; i < maxIndex; i++){
                var song = vcQueue[i];
                var handled;
                if(song.title){
                    handled = handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['queue-embed']['queue-title'], [{NUMBER: (i + 1), TITLE: song.title, URL: song.url}]);
                } else {
                    handled = handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['queue-embed']['queue-url'], [{NUMBER: (i + 1), URL: song.url}]);
                }
                queue += handled;
            }
            if(vcQueue.length > page * 25){
                queue += `\n...`;
            }

            return queue;
        }

        function getThumbnail(thumbnails){
            var maxHeight = Math.max(...thumbnails.map(t => t.height));
            return thumbnails.filter(f => f.height === maxHeight)[0].url;
        }

        function buildQueueEmbed(queue){
            return new Promise(async resolve => {

                const queueEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['queue-embed'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['queue-embed'].message, [{QUEUE: queue}]))
                .setTimestamp();

                if(ytstream.validateVideoURL(vcQueue[0].url)){
                    var videoInfo = client.musicCache.get(vcQueue[0].url);
                    if(!videoInfo){
                        try{
                            var vidInfo = await ytstream.getInfo(vcQueue[0].url);
                            const thumbnail = getThumbnail(vidInfo.thumbnails);
                            queueEmbed.setThumbnail(thumbnail);
                        } catch {}
                    } else {
                        const thumbnail = getThumbnail(videoInfo.info.thumbnails);
                        queueEmbed.setThumbnail(thumbnail);
                    }
                } else if(soundcloud.validateSoundCloudURL(vcQueue[0].url)){
                    var videoInfo = client.musicCache.get(vcQueue[0].url);
                    if(!videoInfo){
                        try{
                            var vidInfo = await soundcloud.getInfo(vcQueue[0].url);
                            queueEmbed.setThumbnail(vidInfo.thumbnail);
                        } catch {}
                    } else {
                        queueEmbed.setThumbnail(videoInfo.info.thumbnail);
                    }
                }

                resolve(queueEmbed);
            });
        }

        var musicQueue = getQueueMessage(currentPage, false);
        var queueEmbed = await buildQueueEmbed(musicQueue);

        function createComponentsCollector(message){
            const filter = i => ['previous-page', 'next-page'].indexOf(i.customId) >= 0;
            const collector = message.createMessageComponentCollector({filter: filter, time: 3*6e4, max: 1});
            collector.on('collect', async i => {
                i.deferUpdate().catch(err => {});
                await wait(400);
                vcQueue = client.audioManager.queue(message.guild.members.me.voice.channel);
                if(i.customId === 'previous-page'){
                    if(currentPage > 1){
                        --currentPage;
                    }
                } else if(i.customId === 'next-page'){
                    if(vcQueue.length > currentPage * 25){
                        ++currentPage;
                    }
                } else {
                    return;
                }
                musicQueue = getQueueMessage(currentPage, false);
                queueEmbed = await buildQueueEmbed(musicQueue);
                message.edit(client.handleContent(message, {embeds: [queueEmbed], components: actionRow})).catch(err => {});
                createComponentsCollector(message);
            });

            collector.on('end', async collected => {
                if(collected.size === 0){
                    var queueText = getQueueMessage(currentPage, true);
                    queueEmbed = await buildQueueEmbed(queueText);
                    message.edit(client.handleContent(message, {embeds: [queueEmbed], components: actionRow})).catch(err => {});
                }
            })
        }

        sendMessage({embeds: [queueEmbed], components: actionRow}).then(msg => {
            if(typeof actionRow !== 'undefined'){
                createComponentsCollector(msg);
            }
        }).catch(err => {});
    }
}
const ytstream = require('yt-stream');
const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const https = require('https');
const http = require('http');
const types = {https, http};
const spotifyInfo = require('spotify-info');
const soundcloud = require('sc-play');

function wait(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function validateURL(string){
    try {
        return new URL(string);
    } catch {
        return false;
    }
}

module.exports = {
    data: {
        name: 'play',
        description: 'Play a song',
        category: 'Music',
        options: [{type: 3, name: 'song', description: 'The YouTube, Spotify or SoundCloud url or a query to search the song', required: true}, {type: 3, name: 'search-engine', description: 'The search engine to use for searching songs', choices: [{name: 'YouTube', value: 'youtube'}, {name: 'SoundCloud', value: 'soundcloud'}], required: false}],
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);
        var msg;

        const handleEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['handle-play'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['handle-play'].message))
        .setTimestamp();

        try {
            msg = await sendMessage({embeds: [handleEmbed]});
            if(interaction === true) msg = message;
            await wait(200);
        } catch (err) {
            return console.log(`Error while trying to send handle message: `, err);
        }
        const replyMessage = client.replyMessage(message, interaction, msg);
        
        const noVC = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['not-connected-embed'].message))
        .setTimestamp();
        const noSong = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['no-song-added'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['no-song-added'].message))
        .setTimestamp();
        const unsupportedSCPlaylist = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['soundcloud-playlist-not-supported'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['soundcloud-playlist-not-supported'].message))
        .setTimestamp();
        const unknownError = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['unknown-error'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['unknown-error'].message))
        .setTimestamp();

        if(!message.member.voice.channel) return replyMessage({embeds: [noVC]}).catch(err => {});
        if(!args[1]) return replyMessage({embeds: [noSong]}).catch(err => {});

        var vc = message.guild.members.me.voice.channel || message.member.voice.channel;

        function getStream(url, info){
            var streamEmbed;
            if(ytstream.validateURL(url)){
                client.musicCache.set(info.url, {info: info, expire: new Date().getTime() + 6e4 *60});
                var duration = info.duration;
                var maxDuration = 10*60*60*1000;
                if(duration > maxDuration){
                    const tooLongEmbed = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['video-too-long'].title))
                    .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['video-too-long'].message))
                    .setTimestamp();

                    return replyMessage({embeds: [tooLongEmbed]}).catch(err => {});
                }
                var days = Math.floor(duration / 24 / 60 / 60 / 1000);
                var hours = Math.floor(duration / 60 / 60 / 1000) - 24*days;
                var minutes = Math.floor(duration / 60 / 1000) - 60*hours;
                var seconds = Math.floor(duration / 1000) - (minutes*60 + 24*60*60*days + hours*60*60);
                var durationString = '';
                if(days > 0) durationString += `${days}:`;
                if(hours > 0) durationString += `${hours}:`;
                durationString += `${minutes.toString().length > 1 ? minutes : `0${minutes}`}:${seconds.toString().length > 1 ? seconds : `0${seconds}`}`;
                streamEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setURL(info.url)
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['yt-embed'].title, [{TITLE: info.title}]))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['yt-embed'].message, [{TITLE: info.title, AUTHOR: info.author, VIEWS: info.views_text, UPLOADED: info.uploaded, AUTHOR_URL: info.channel.url, DURATION: durationString}]))
                .setThumbnail(info.default_thumbnail.url)
                .setTimestamp();

                if(messages['music-cmds']['play-embeds']['success-embeds']['yt-embed'].fields.length > 0){
                    streamEmbed.setFields(messages['music-cmds']['play-embeds']['success-embeds']['yt-embed'].fields.reduce((arr, item) => {
                        const fieldKeys = Object.keys(item);
                        const fieldValues = Object.values(item);
                        let obj = {};
                        for(var i = 0; i < fieldKeys.length; i++){
                            let fieldKey = fieldKeys[i];
                            let fieldValue = fieldValues[i];
                            if(typeof fieldValue === 'string'){
                                fieldValue = handleMessage(client, message.member.user, undefined, message.channel, fieldValue, [{TITLE: info.title, AUTHOR: info.author, VIEWS: info.views_text, UPLOADED: info.uploaded, AUTHOR_URL: info.channel.url, DURATION: durationString}]);
                            }
                            obj[fieldKey] = fieldValue;
                        }
                        arr.push(obj);
                        return arr;
                    }, []));
                }

                client.audioManager.play(vc, url, {
                    quality: 'high',
                    volume: 10,
                    type: 'youtube'
                }).then(() => {
                    replyMessage({embeds: [streamEmbed]}).catch(err => {});
                }).catch(err => {
                    console.log(`Error while trying to play in the voice channel: `, String(err));
                    replyMessage({embeds: [unknownError]}).catch(err => {});
                });
            } else if(soundcloud.validateSoundCloudURL(url)){
                client.musicCache.set(info.url, {info: info, expire: new Date().getTime() + 6e4 *60});
                var duration = info.duration;
                let streamsString = info.streams.toString().split("");
                streamsString.reverse();
                let newStreamsString = [];
                for(let i = 1; i <= streamsString.length; i++){
                    newStreamsString.push(streamsString[i - 1]);
                    if(i%3 === 0 && i !== streamsString.length){
                        newStreamsString.push('.');
                    }
                }
                newStreamsString.reverse();
                newStreamsString = newStreamsString.join("");
                var maxDuration = 10*60*60*1000;
                if(duration > maxDuration){
                    const tooLongEmbed = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['video-too-long'].title))
                    .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['video-too-long'].message))
                    .setTimestamp();

                    return replyMessage({embeds: [tooLongEmbed]}).catch(err => {});
                }
                var days = Math.floor(duration / 24 / 60 / 60 / 1000);
                var hours = Math.floor(duration / 60 / 60 / 1000) - 24*days;
                var minutes = Math.floor(duration / 60 / 1000) - 60*hours;
                var seconds = Math.floor(duration / 1000) - (minutes*60 + 24*60*60*days + hours*60*60);
                var durationString = '';
                if(days > 0) durationString += `${days}:`;
                if(hours > 0) durationString += `${hours}:`;
                durationString += `${minutes.toString().length > 1 ? minutes : `0${minutes}`}:${seconds.toString().length > 1 ? seconds : `0${seconds}`}`;
                let uploadedDate = `${info.uploaded.getDate()}-${info.uploaded.getMonth() + 1}-${info.uploaded.getFullYear()}`
                streamEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setURL(info.url)
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['yt-embed'].title, [{TITLE: info.title}]))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['yt-embed'].message, [{TITLE: info.title, AUTHOR: info.author.name, VIEWS: newStreamsString, UPLOADED: uploadedDate, AUTHOR_URL: info.author.url, DURATION: durationString}]))
                .setThumbnail(info.thumbnail)
                .setTimestamp();

                if(messages['music-cmds']['play-embeds']['success-embeds']['yt-embed'].fields.length > 0){
                    streamEmbed.setFields(messages['music-cmds']['play-embeds']['success-embeds']['yt-embed'].fields.reduce((arr, item) => {
                        const fieldKeys = Object.keys(item);
                        const fieldValues = Object.values(item);
                        let obj = {};
                        for(var i = 0; i < fieldKeys.length; i++){
                            let fieldKey = fieldKeys[i];
                            let fieldValue = fieldValues[i];
                            if(typeof fieldValue === 'string'){
                                fieldValue = handleMessage(client, message.member.user, undefined, message.channel, fieldValue, [{TITLE: info.title, AUTHOR: info.author.name, VIEWS: newStreamsString, UPLOADED: uploadedDate, AUTHOR_URL: info.author.url, DURATION: durationString}]);
                            }
                            obj[fieldKey] = fieldValue;
                        }
                        arr.push(obj);
                        return arr;
                    }, []));
                }

                client.audioManager.play(vc, url, {
                    quality: 'high',
                    volume: 10,
                    type: 'soundcloud'
                }).then(() => {
                    replyMessage({embeds: [streamEmbed]}).catch(err => {});
                }).catch(err => {
                    console.log(`Error while trying to play in the voice channel: `, String(err));
                    replyMessage({embeds: [unknownError]}).catch(err => {});
                });
            } else {
                streamEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setURL(url)
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['non-yt-embed'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['non-yt-embed'].message, [{SONG: `[${messages['music-cmds']['play-embeds']['song-text'].toLowerCase()}](${url})`}]))
                .setTimestamp();

                client.audioManager.play(vc, url, {
                    quality: 'high',
                    volume: 10,
                    type: 'raw'
                }).then(() => {
                    replyMessage({embeds: [streamEmbed]}).catch(err => {});
                }).catch(err => {
                    console.log(`Error while trying to play in the voice channel: `, String(err));
                    replyMessage({embeds: [unknownError]}).catch(err => {});
                });
            }
        }

        const urlValidation = validateURL(args[1]);

        if(ytstream.validateVideoURL(args[1])){
            ytstream.getInfo(args[1]).then(info => {
                getStream(args[1], info);
            }).catch(err => {
                console.log(`Error while trying to get info: `, err);
                replyMessage({embeds: [unknownError]}).catch(err => {});
            });
        } else if(ytstream.validatePlaylistURL(args[1])){
            ytstream.getPlaylist(args[1]).then(playlist => {
                var playlistEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['playlist-added'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['playlist-added'].message, [{PLAYLIST_NAME: playlist.title, PLAYLIST_URL: playlist.url, AUTHOR: playlist.author, AUTHOR_URL: playlist.author_channel}]))
                .setTimestamp();
                
                for(var i = 0; i < playlist.videos.length; i++){
                    var video = playlist.videos[i];
                    client.musicCache.set(video.video_url, {info: video, expire: new Date().getTime() + 6e4 *60});
                }

                client.audioManager.play(vc, args[1], {
                    quality: 'high',
                    volume: 10
                }).then(() => {
                    replyMessage({embeds: [playlistEmbed]}).catch(err => {});
                }).catch(err => {
                    console.log(`Error while trying to play in the voice channel: `, String(err));
                    replyMessage({embeds: [unknownError]}).catch(err => {});
                });
            }).catch(err => {
                console.log(`Error while trying to get playlist info: `, err);
                replyMessage({embeds: [unknownError]}).catch(err => {});
            })
        } else if(spotifyInfo.validateTrackURL(args[1])){
            (client.spotifyApi ? spotifyInfo.getTrack(args[1]) : spotifyInfo.scrapeTrack(args[1])).then(song => {
                ytstream.search(`${song.name} ${client.spotifyApi ? song.artists[0].name : song.artist}`).then(songs => {
                    if(songs.length === 0) return replyMessage({embeds: [unknownError]}).catch(err => {});
                    ytstream.getInfo(songs[0].url).then(info => {
                        getStream(info.url, info);
                    }).catch(err => {
                        console.log(`Error while trying to get info: `, err);
                        replyMessage({embeds: [unknownError]}).catch(err => {});
                    });
                }).catch(err => {
                    console.log(`Error while trying to search the Spotify song: `, String(err));
                    replyMessage({embeds: [unknownError]}).catch(err => {});
                });
            }).catch(err => {
                console.log(`Error while trying to get the Spotify song: `, String(err));
                replyMessage({embeds: [unknownError]}).catch(err => {});
            });
        } else if(spotifyInfo.validatePlaylistURL(args[1])){
            (client.spotifyApi ? spotifyInfo.getPlaylist(args[1]) : spotifyInfo.scrapePlaylist(args[1])).then(async playlist => {

                let playlistData = client.spotifyApi ? [{PLAYLIST_NAME: playlist.name, PLAYLIST_URL: playlist.url, AUTHOR: playlist.owner.name, AUTHOR_URL: playlist.owner.url}] : [{PLAYLIST_NAME: playlist.name, PLAYLIST_URL: playlist.url, AUTHOR: playlist.creator, AUTHOR_URL: playlist.creatorUrl}];

                var playlistEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['playlist-added'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['playlist-added'].message, playlistData))
                .setTimestamp();

                if(client.spotifyApi){
                    if(typeof playlist.images[0] === 'object'){
                        playlistEmbed.setThumbnail(playlist.images[0].url);
                    }
                } else {
                    if(typeof playlist.thumbnail === 'string'){
                        playlistEmbed.setThumbnail(playlist.thumbnail);
                    }
                }

                let replied = false;
                
                for(var i = 0; i < (client.spotifyApi ? playlist.tracks.items.length : playlist.tracks.length); i++){
                    if((!message.guild.members.me.voice.channel && i > 0) || (!client.playing.get(vc.id) && i > 0)) continue;
                    var video = (client.spotifyApi ? playlist.tracks.items : playlist.tracks)[i];
                    try{
                        var search = await ytstream.search(`${video.name} ${client.spotifyApi ? video.artists[0].name : video.artist}`);
                        await wait(1000);
                        if(search.length === 0) continue;
                        var info = await ytstream.getInfo(search[0].url);
                        client.musicCache.set(info.url, {info: info, expire: new Date().getTime() + 6e4 * 60});
                        await wait(1000);
                        await client.audioManager.play(vc, search[0].url, {
                            quality: 'high',
                            volume: 10
                        });
                        if(replied === false){
                            replyMessage({embeds: [playlistEmbed]}).catch(err => {});
                            replied = true;
                        }
                        await wait(1000);
                    } catch(err) {
                        console.log(err);
                    }
                }
            }).catch(err => {
                console.log(`Error while trying to get the Spotify playlist: `, String(err));
                replyMessage({embeds: [unknownError]}).catch(err => {});
            });
        } else if(spotifyInfo.validateAlbumURL(args[1])){
            (client.spotifyApi ? spotifyInfo.getAlbum(args[1]) : spotifyInfo.scrapeAlbum(args[1])).then(async album => {
                var albumEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['playlist-added'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['success-embeds']['playlist-added'].message, [{PLAYLIST_NAME: album.name, PLAYLIST_URL: album.url, AUTHOR: album.artist, AUTHOR_URL: album.artistUrl}]))
                .setTimestamp();

                if(client.spotifyApi){
                    if(typeof album.images[0] === 'object'){
                        albumEmbed.setThumbnail(album.images[0].url);
                    }
                } else {
                    if(typeof album.thumbnail === 'string'){
                        albumEmbed.setThumbnail(album.thumbnail);
                    }
                }

                let replied = false;
                
                for(var i = 0; i < album.tracks.length; i++){
                    if(!message.guild.members.me.voice.channel && i > 0) continue;
                    var video = album.tracks[i];
                    try{
                        var search = await ytstream.search(`${video.name} ${client.spotifyApi ? video.artists[0].name : video.artist}`);
                        await wait(1000);
                        if(search.length === 0) continue;
                        var info = await ytstream.getInfo(search[0].url);
                        client.musicCache.set(info.url, {info: info, expire: new Date().getTime() + 6e4 * 60});
                        await wait(1000);
                        await client.audioManager.play(vc, search[0].url, {
                            quality: 'high',
                            volume: 10
                        });
                        if(replied === false){
                            replyMessage({embeds: [albumEmbed]}).catch(err => {});
                            replied = true;
                        }
                        await wait(1000);
                    } catch(err) {
                        console.log(err);
                    }
                }
            }).catch(err => {
                console.log(`Error while trying to get the Spotify album: `, String(err));
                replyMessage({embeds: [unknownError]}).catch(err => {});
            });
        } else if(soundcloud.validateSoundCloudURL(args[1])){
            soundcloud.getInfo(args[1]).then(info => {
                if(info.type === 'track'){
                    getStream(args[1], info);
                } else {
                    replyMessage({embeds: [unsupportedSCPlaylist]}).catch(err => {});
                }
            }).catch(err => {
                console.log(`Error while getting SoundCloud info:`, String(err));
                replyMessage({embeds: [unknownError]}).catch(err => {});
            });
        } else if(urlValidation){
            const reqType = types[urlValidation.protocol.split(':')[0].toLowerCase()];
            if(!reqType) return replyMessage({embeds: [unknownError]}).catch(err => {});
            new Promise((resolve, reject) => {
                const req = reqType.request({
                    host: urlValidation.hostname,
                    path: urlValidation.pathname + urlValidation.search,
                    method: 'GET',
                    headers: {
                        'user-agent': 'Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36.0 (KHTML, like Gecko) Chrome/61.0.0.0 Safari/537.36.0',
                        'accept-language': 'en-US,en-IN;q=0.9,en;q=0.8,hi;q=0.7'
                    }
                }, res => {
                    if(res.statusCode !== 200 && res.statusCode !== 206) return reject(`Invalid URL`);
                    if(!res.headers['content-type'].startsWith('audio/')) return reject(`URL is not a song`);

                    res.on('error', error => {
                        return reject(error);
                    });

                    resolve();
                });

                req.on('error', error => {
                    reject(error);
                });

                req.end();
            }).then(() => {
                getStream(args[1]);
            }).catch(err => {
                const unplayable = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['unplayable-url'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['unplayable-url'].message))
                .setTimestamp();

                replyMessage({embeds: [unplayable]}).catch(err => {});
            });
        } else {
            const searchEngines = ['youtube', 'soundcloud'];
            let searchEngine = 'youtube';
            if(searchEngines.indexOf(args[args.length - 1].toLowerCase()) >= 0){
                searchEngine = args[args.length - 1].toLowerCase();
                args.splice(args.length - 1, 1);
            }
            var query = args.slice(1).join(' ');
            if(query.length > 50){
                query = query.substring(0, 50).split("`").join("");
            }
            const noResults = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['no-result'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['music-cmds']['play-embeds']['error-embeds']['no-result'].message, query))
            .setTimestamp();

            if(searchEngine === 'youtube'){
                ytstream.search(query).then(results => {
                    if(results.length === 0) return replyMessage({embeds: [noResults]}).catch(err => {});
                    var video = results[0].url;
                    ytstream.getInfo(video).then(info => {
                        getStream(info.url, info);
                    }).catch(err => {
                        console.log(`Error while trying to get info: `, err);
                        replyMessage({embeds: [unknownError]}).catch(err => {});
                    });
                }).catch(err => {
                    console.log(`Error while searching video: `, err);
                    replyMessage({embeds: [unknownError]}).catch(err => {});
                });
            } else if(searchEngine === 'soundcloud'){
                soundcloud.search(query, {type: 'tracks', limit: 1}).then(results => {
                    if(results.length === 0) return replyMessage({embeds: [noResults]}).catch(err => {});
                    var track = results[0];
                    soundcloud.getInfo(track.url).then(info => {
                        getStream(info.url, info);
                    }).catch(err => {
                        console.log(`Error while trying to get info: `, err);
                        replyMessage({embeds: [unknownError]}).catch(err => {});
                    });
                }).catch(err => {
                    console.log(`Error while searching video: `, err);
                    replyMessage({embeds: [unknownError]}).catch(err => {});
                });
            }
        }
    }
};
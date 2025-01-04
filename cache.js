const ValueSaver = require('valuesaver');
const { Player } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const { QueryType } = require('discord-player');

// Create AudioManager class
class AudioManager {
    constructor(client, options = {}) {
        if (!client) {
            this.eventEmitter = new (require('events'))();
            return;
        }

        this.client = client;
        this.eventEmitter = new (require('events'))();
        
        // Create player with specific options
        this.player = new Player(client, {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        });

        // Register extractors
        this.player.extractors.register(YoutubeiExtractor, {
            forceRevalidate: true
        });

        // Set up event handlers
        this.player.events.on('playerStart', (queue, track) => {
            this.eventEmitter.emit('play', queue.channel, track);
            this.client.playing.set(queue.channel.id, true);
        });

        this.player.events.on('playerFinish', (queue) => {
            this.eventEmitter.emit('end', queue.channel);
            this.client.playing.delete(queue.channel.id);
        });

        this.player.events.on('disconnect', (queue) => {
            this.eventEmitter.emit('connection_destroy', queue.channel);
            this.client.playing.delete(queue.channel.id);
        });

        this.player.events.on('error', (queue, error) => {
            console.error('Player error:', error);
        });

        this.player.events.on('playerError', (queue, error) => {
            console.error('Player playback error:', error);
        });
    }

    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }

    async play(voiceChannel, url, options = {}) {
        try {
            // Create or get queue
            let queue = this.player.nodes.get(voiceChannel.guild);
            
            if (!queue) {
                queue = this.player.nodes.create(voiceChannel.guild, {
                    metadata: {
                        channel: voiceChannel,
                        client: this.client
                    },
                    selfDeaf: true,
                    volume: options.volume || 100,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000,
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000,
                    bufferingTimeout: 0,
                    connectionTimeout: 999999999
                });
            }

            // Connect to voice channel
            if (!queue.connection) {
                await queue.connect(voiceChannel);
            }

            // Search for track
            const result = await this.player.search(url, {
                requestedBy: this.client.user,
                searchEngine: QueryType.AUTO
            });

            if (!result || !result.tracks.length) {
                queue.delete();
                throw new Error('No results found');
            }

            // Add track and play
            const track = result.tracks[0];
            queue.addTrack(track);

            if (!queue.isPlaying()) {
                await queue.node.play();
            }

            return Promise.resolve();
        } catch (error) {
            console.error('Play error:', error);
            return Promise.reject(error);
        }
    }

    queue(voiceChannel) {
        if (!this.player?.nodes) return [];
        const queue = this.player.nodes.get(voiceChannel.guild);
        return queue ? queue.tracks.toArray() : [];
    }

    async skip(voiceChannel) {
        try {
            const queue = this.player.nodes.get(voiceChannel.guild);
            if (queue) {
                queue.node.skip();
                return Promise.resolve();
            }
            return Promise.reject('No queue found');
        } catch (error) {
            return Promise.reject(error);
        }
    }

    removeFilter() {
        return Promise.resolve();
    }

    destroy() {
        if (this.player) {
            this.player.destroy();
            this.eventEmitter.emit('destroy');
        }
    }
}

module.exports = function (client) {
    return new Promise(async resolve => {
        client.commands = new ValueSaver();
        client.categories = new ValueSaver();
        client.interactions = new ValueSaver();
        client.interactionActions = new ValueSaver();
        client.addons = new ValueSaver();
        client.musicCache = new ValueSaver();
        client.globals = new ValueSaver();
        client.tickets = new ValueSaver();
        client.warns = new ValueSaver();
        client.giveaways = new ValueSaver();
        client.giveawaysEnded = new ValueSaver();
        client.xp = new ValueSaver();
        client.economy = new ValueSaver();
        client.badwords = new ValueSaver();
        client.userinfo = new ValueSaver();
        client.unverified = new ValueSaver();
        client.reactrole = new ValueSaver();
        client.suggestions = new ValueSaver();
        client.afk = new ValueSaver();
        client.polls = new ValueSaver();
        client.shop = new ValueSaver();
        await client.dbHandler.start(client);
        client.interactionInfo = new ValueSaver();
        client.interactionInfo.set(`unwarn`, new ValueSaver());
        client.interactionInfo.set(`mute`, new ValueSaver());
        client.interactionInfo.set(`blackjack`, new ValueSaver());
        client.interactionInfo.set(`ignore`, new ValueSaver());
        client.messageCache = new ValueSaver();
        client.verified = new ValueSaver();
        client.invitesManager = new ValueSaver();
        client.playing = new ValueSaver();
        client.banned = new ValueSaver();
        setInterval(function () {
            client.banned.clear();
        }, 60000);
        setInterval(function () {
            client.messageCache.clear();
        }, 10e3);
        client.audioManager = new AudioManager(client);
        client.isGeneratingBackUp = false;

        client.audioManager.on('play', (channel, stream) => {
            client.playing.set(channel.id, true);
        });
        client.audioManager.on('end', (channel) => {
            client.playing.delete(channel.id);
        });
        client.audioManager.on('destroy', () => {
            client.playing.clear();
        });
        client.audioManager.on('connection_destroy', (channel) => {
            client.playing.delete(channel.id);
        });

        setInterval(function () {
            var expiredKeys = client.musicCache.filter(v => v.value.expire < new Date().getTime()).toReadableArray().map(v => v.key);
            for (var i = 0; i < expiredKeys.length; i++) {
                var expiredKey = expiredKeys[i];
                client.musicCache.delete(expiredKey);
            }
        }, 6e4 * 20);

        client.cache = {
            getUser: function (userId) {
                return new Promise((resolve, reject) => {
                    const cachedUser = client.users.cache.get(userId);
                    if (cachedUser) return resolve(cachedUser);
                    const _user = client.cache.__cache.users.get(userId);
                    if (!_user) {
                        client.users.fetch(userId).then(user => {
                            client.cache.__cache.users.set(userId, { user: user, timestamp: new Date().getTime() });
                            resolve(user);
                        }).catch(err => {
                            resolve(false);
                        });
                    } else {
                        var max_diff = 1000 * 60 * 60 * 3;
                        if ((new Date().getTime() - _user.timestamp) > max_diff) {
                            client.users.fetch(userId).then(user => {
                                client.cache.__cache.users.set(userId, { user: user, timestamp: new Date().getTime() });
                                resolve(user);
                            }).catch(err => {
                                resolve(false);
                            });
                        } else {
                            resolve(_user.user);
                        }
                    }
                });
            },
            getMember: function (userId, g) {
                return new Promise((resolve, reject) => {
                    const cachedMember = g.members.cache.get(userId);
                    if (cachedMember) return resolve(cachedMember);
                    const _member = client.cache.__cache.members.get(userId) || {};
                    if (!_member[g.id]) {
                        g.members.fetch(userId.toString()).then(member => {
                            let memberInfo = {};
                            memberInfo[g.id] = { member: member, timestamp: new Date().getTime() };
                            client.cache.__cache.members.set(userId, { ..._member, memberInfo });
                            resolve(member);
                        }).catch(err => {
                            resolve(false);
                        });
                    } else {
                        var max_diff = 1000 * 60 * 60 * 3;
                        if ((new Date().getTime() - _member[g.id].timestamp) > max_diff) {
                            delete _member[g.id];
                            g.members.fetch(userId.toString()).then(member => {
                                let memberInfo = {};
                                memberInfo[g.id] = { member: member, timestamp: new Date().getTime() };
                                client.cache.__cache.members.set(userId, { ..._member, memberInfo });
                                resolve(member);
                            }).catch(err => {
                                resolve(false);
                            });
                        } else {
                            resolve(_member[g.id].member);
                        }
                    }
                });
            },
            getChannel: function (channelId, g) {
                return new Promise((resolve, reject) => {
                    const cachedChannel = g.channels.cache.get(channelId);
                    if (cachedChannel) return resolve(cachedChannel);
                    const _channel = client.cache.__cache.channels.get(channelId);
                    if (!_channel) {
                        g.channels.fetch(channelId).then(channel => {
                            client.cache.__cache.channels.set(channelId, { channel: channel, timestamp: new Date().getTime() });
                            resolve(channel);
                        }).catch(err => {
                            resolve(false);
                        });
                    } else {
                        var max_diff = 1000 * 60 * 60 * 3;
                        if ((new Date().getTime() - _channel.timestamp) > max_diff) {
                            g.channels.fetch(channelId).then(channel => {
                                client.cache.__cache.channels.set(channelId, { channel: channel, timestamp: new Date().getTime() });
                                resolve(channel);
                            }).catch(err => {
                                resolve(false);
                            });
                        } else {
                            resolve(_channel.channel);
                        }
                    }
                });
            },
            getRole: function (roleId, g) {
                return new Promise((resolve, reject) => {
                    const cachedRole = g.roles.cache.get(roleId);
                    if (cachedRole) return resolve(cachedRole);
                    const _role = client.cache.__cache.roles.get(roleId);
                    if (!_role) {
                        g.roles.fetch(roleId).then(role => {
                            client.cache.__cache.roles.set(roleId, { role: role, timestamp: new Date().getTime() });
                            resolve(role);
                        }).catch(err => {
                            resolve(false);
                        });
                    } else {
                        var max_diff = 1000 * 60 * 60 * 3;
                        if ((new Date().getTime() - _role.timestamp) > max_diff) {
                            g.roles.fetch(roleId).then(role => {
                                client.cache.__cache.roles.set(roleId, { role: role, timestamp: new Date().getTime() });
                                resolve(role);
                            }).catch(err => {
                                resolve(false);
                            });
                        } else {
                            resolve(_role.role);
                        }
                    }
                });
            },
            getGuild: function (guildId) {
                return new Promise((resolve, reject) => {
                    const cachedGuild = client.guilds.cache.get(guildId);
                    if (cachedGuild) return resolve(cachedGuild);
                    const _guild = client.cache.__cache.guilds.get(guildId);
                    if (!_guild) {
                        client.guilds.fetch(guildId).then(guild => {
                            client.cache.__cache.guilds.set(guildId, { guild: guild, timestamp: new Date().getTime() });
                            resolve(guild);
                        }).catch(err => {
                            resolve(false);
                        });
                    } else {
                        var max_diff = 1000 * 60 * 60 * 3;
                        if ((new Date().getTime() - _guild.timestamp) > max_diff) {
                            client.guilds.fetch(guildId).then(guild => {
                                client.cache.__cache.guilds.set(guildId, { guild: guild, timestamp: new Date().getTime() });
                                resolve(guild);
                            }).catch(err => {
                                resolve(false);
                            });
                        } else {
                            resolve(_guild.guild);
                        }
                    }
                });
            },
            __cache: {
                users: new ValueSaver(),
                members: new ValueSaver(),
                channels: new ValueSaver(),
                roles: new ValueSaver(),
                guilds: new ValueSaver()
            }
        }

        resolve();
    });
}

module.exports.AudioManager = AudioManager;
const { ActivityType, PermissionFlagsBits, OAuth2Scopes } = require('discord.js');
const spotifyInfo = require('spotify-info');
const { ValueSaver } = require('valuesaver');
const { readFolder, wait } = require('./functions.js');
const cache = require('./cache.js');
const giveawayHandler = require('./handlers/giveaway.js');
const pollHandler = require('./handlers/polls.js');
const config = require('./config.json');
const path = require('path');
const messageHandler = require('./handlers/handleMessages.js');

return module.exports = {
    data: {
        name: 'ready',
        type: 'once'
    },
    callback: function (client) {
        return async function () {
            console.log(`Bot started as ${client.user.username} at ${new Date().toString()}`);

            await cache(client);

            client.botInvite = client.generateInvite({
                scopes: [
                    OAuth2Scopes.Bot,
                    OAuth2Scopes.ApplicationsCommands
                ],
                permissions: [
                    PermissionFlagsBits.Administrator
                ]
            });

            Object.defineProperty(client, 'mainguilds', { value: new Map(), writable: true });
            Object.defineProperty(client, 'logs', { value: new Map(), writable: true });
            Object.defineProperty(client, 'welcomeChannel', { value: new Map(), writable: true });
            Object.defineProperty(client, 'leaveChannel', { value: new Map(), writable: true });
            Object.defineProperty(client, 'countingChannel', { value: new Map(), writable: true });
            Object.defineProperty(client, 'snakeChannel', { value: new Map(), writable: true });
            Object.defineProperty(client, 'xpChannel', { value: new Map(), writable: true });
            Object.defineProperty(client, 'suggestionChannel', { value: new Map(), writable: true });
            Object.defineProperty(client, 'verifyChannel', { value: new Map(), writable: true });
            Object.defineProperty(client, 'ticketLogs', { value: new Map(), writable: true });

            client.embedColor = config.embeds.color;

            client.spotifyApi = typeof client.config.spotifyCredentials.clientId === 'string' && typeof client.config.spotifyCredentials.clientSecret === 'string';
            if (client.spotifyApi) spotifyInfo.setApiCredentials(client.config.spotifyCredentials.clientId, client.config.spotifyCredentials.clientSecret);

            for (let g = 0; g < config.guilds.length; g++) {
                try {
                    const guild = config.guilds[g];

                    client.mainguilds[guild] = await client.cache.getGuild(guild.toString());
                    if (!client.mainguilds[guild]) {
                        delete client.mainguilds[guild];
                        continue;
                    }
                    const guildObj = client.mainguilds[guild];
                    if (!guildObj.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
                        throw new Error(`The bot doesn't have administrator permissions in the server ${client.mainguilds[guild].name}, please invite the bot using the following invite: ${client.botInvite}`);
                    }

                    await Promise.all([
                        wait(300).then(() => guildObj.invites.fetch({ cache: true })),
                        wait(400).then(() => guildObj.channels.fetch()),
                        wait(300).then(() => guildObj.members.fetch()),
                        wait(300).then(() => guildObj.emojis.fetch())
                    ]);

                    client.logs.set(guild, {
                        channel: ['string', 'number'].includes(typeof config.logs['channel'][guild]) ? guildObj.channels.cache.get(config.logs['channel'][guild].toString()) : null,
                        member: ['string', 'number'].includes(typeof config.logs['member'][guild]) ? guildObj.channels.cache.get(config.logs['member'][guild].toString()) : null,
                        role: ['string', 'number'].includes(typeof config.logs['role'][guild]) ? guildObj.channels.cache.get(config.logs['role'][guild].toString()) : null,
                        message: ['string', 'number'].includes(typeof config.logs['message'][guild]) ? guildObj.channels.cache.get(config.logs['message'][guild].toString()) : null,
                    });

                    client.ticketLogs.set(guild, ['string', 'number'].includes(typeof config.tickets['logs-channel'][guild]) ? guildObj.channels.cache.get(config.tickets['logs-channel'][guild].toString()) : null);
                    client.welcomeChannel.set(guild, ['string', 'number'].includes(typeof config.welcome[guild].channel) ? guildObj.channels.cache.get(config.welcome[guild].channel.toString()) : null);
                    client.leaveChannel.set(guild, ['string', 'number'].includes(typeof config.leave[guild].channel) ? guildObj.channels.cache.get(config.leave[guild].channel.toString()) : null);
                    client.countingChannel.set(guild, ['string', 'number'].includes(typeof config.countingChannel[guild]) ? guildObj.channels.cache.get(config.countingChannel[guild].toString()) : null);
                    client.snakeChannel.set(guild, ['string', 'number'].includes(typeof config.snakeChannel[guild]) ? guildObj.channels.cache.get(config.snakeChannel[guild].toString()) : null);
                    client.xpChannel.set(guild, ['string', 'number'].includes(typeof config.level['notification-channel'][guild]) ? guildObj.channels.cache.get(config.level['notification-channel'][guild].toString()) : null);
                    client.suggestionChannel.set(guild, ['string', 'number'].includes(typeof config.suggestion[guild].channel) ? guildObj.channels.cache.get(config.suggestion[guild].channel.toString()) : null);
                    client.verifyChannel.set(guild, ['string', 'number'].indexOf(typeof (client.globals.get(`verification-channel`) || {})[guild]) >= 0 ? guildObj.channels.cache.get(client.globals.get(`verification-channel`)[guild].toString()) : null);

                    let bans = await guildObj.bans.fetch({ limit: 100 });
                    while (bans.size === 100) {
                        bans = await guildObj.bans.fetch({ limit: 100, after: bans.lastKey() });
                    }

                    const membersCount = client.deepCopy(client.globals.get('membersCount') || {});
                    if (!membersCount[guild]) {
                        membersCount[guild] = [];
                        const week = 1000 * 60 * 60 * 24 * 7;
                        while (membersCount[guild].length < 5) {
                            const currentDate = new Date().getTime();
                            membersCount[guild].push({
                                count: client.mainguilds[guild].memberCount,
                                timestamp: currentDate - (week * membersCount[guild].length)
                            });
                        }
                        membersCount[guild].reverse();
                        await client.dbHandler.setValue('globals', membersCount, { globalsKey: 'membersCount' });
                    }

                    let nextUpdate = membersCount[guild][membersCount[guild].length - 1].timestamp + 1000 * 60 * 60 * 24 * 7;
                    const hour = 2 * 60 * 60 * 1000;
                    const updateMembersCount = async (_g) => {
                        if (nextUpdate < new Date().getTime()) {
                            nextUpdate = new Date().getTime() + 1000 * 60 * 60 * 24 * 7;
                            membersCount[_g].shift();
                            membersCount[_g].push({
                                count: client.mainguilds[_g].memberCount,
                                timestamp: new Date().getTime()
                            });
                            await client.dbHandler.setValue('globals', membersCount, { globalsKey: 'membersCount' });
                        } else {
                            const delay = (new Date().getTime() + hour) > nextUpdate ? (nextUpdate - new Date().getTime() + 10000) : hour;
                            setTimeout(updateMembersCount, delay, _g);
                        }
                    };
                    setTimeout(updateMembersCount, hour, guild);

                    const openTickets = [...client.tickets.toReadableArray()];
                    for (const openTicket of openTickets) {
                        if (typeof openTicket.value === 'string') {
                            openTicket.value = [{ channel: openTicket.value, closed: false, claimed: false, category: false, guild: guild }];
                            await client.dbHandler.setValue('tickets', openTicket.value[0], { channelId: openTicket.value[0].channel, guildId: guild, memberId: openTicket.key });
                        }
                        if (Array.isArray(openTicket.value)) {
                            let addTickets = [];
                            openTicket.value = openTicket.value.map(t => {
                                if (typeof t === 'object') return t;
                                const ticketObj = { channel: t, closed: false, claimed: false, category: false, guild: guild };
                                addTickets.push(ticketObj);
                                return ticketObj;
                            });
                            for (const addTicket of addTickets) {
                                await client.dbHandler.setValue('tickets', addTicket, { memberId: openTicket.key, guildId: guild, channelId: addTicket.channel });
                            }
                            for (const ticketChannelId of openTicket.value) {
                                if (ticketChannelId.guild !== guild) continue;
                                if (!guildObj.channels.cache.get(ticketChannelId.channel)) {
                                    const getTicketChannel = await client.cache.getChannel(ticketChannelId.channel, guildObj);
                                    if (getTicketChannel) continue;
                                    await client.dbHandler.deleteValue('tickets', openTicket.value[z], { memberId: openTicket.key, guildId: guild, channelId: ticketChannelId.channel });
                                }
                            }
                        }
                    }

                    client.checkTemporary(client.mainguilds[guild]).catch(console.log);
                } catch (err) {
                    console.log(`Skipping guild ${guild} due to error: ${err.message}`);
                    continue;
                }
            }

            const reactMessages = client.reactrole.toReadableArray();
            for (const reactMsg of reactMessages) {
                const msgId = reactMsg.key;
                const chId = reactMsg.value[0].channel;
                try {
                    let channel = client.channels.cache.get(chId);
                    if (!channel) {
                        channel = await client.cache.getChannel(chId, client.mainguilds[guild]);
                    }
                    if (!channel) continue;
                    await wait(300);
                    if (!channel.messages.cache.get(msgId)) {
                        await channel.messages.fetch(msgId);
                    }
                } catch {
                    continue;
                }
            }

            console.log(`Loaded reaction messages`);

            const actions = await readFolder(['./interactions']);
            for (const action of actions) {
                if (!action.toLowerCase().endsWith('.js')) continue;
                const r = require(path.join(__dirname, './', action));
                client.interactions.set(r.data.id, r);
            }

            console.log(`Loaded interaction actions`);

            const setPresence = () => {
                client.user.setPresence({
                    activities: [{
                        name: messageHandler(client, client.user, undefined, { name: 'None', id: 'None' }, config.activity, [{ MEMBER_COUNT: client.guilds.cache.reduce((a, g) => a += g.memberCount, 0) }]),
                        type: ActivityType.Playing
                    }],
                    status: 'online'
                });
            };
            setPresence();

            client.presenceUpdate = setInterval(setPresence, 1000 * 60 * 60);

            console.log(`Commands are being loaded...`);

            try {
                await client.updateCommands([], true);
            } catch (err) {
                throw new Error(`Commands couldn't be loaded: ${err}`);
            }


            console.log(`Updated ticket status`);

            client.giveawayHandler = giveawayHandler(client);
            await client.giveawayHandler.reload();
            await wait(400);

            console.log(`Giveaways reloaded`);

            client.pollHandler = pollHandler;
            await client.pollHandler.reload(client);
            await wait(400);

            console.log(`Polls reloaded`);

            try {
                await client.application.fetch();
                await wait(400);
            } catch (err) {
                console.log(err);
            }

            client.onlineAt = new Date();
            client.reloadingCommands = false;

            client.updateInvites();

            console.log(`Ready to be used`);

            client.ready = true;
            client.clientParser.emit('ready');
        };
    }
};
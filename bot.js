const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, User, Team, PermissionFlagsBits, Routes, REST } = require('discord.js');
const fs = require('fs');
const { promisify } = require('util');
const { spawn } = require('child_process');
const ytstream = require('yt-stream');
const { ValueSaver } = require('valuesaver');
const { readFolder, wait, getXPForLevel, passClient } = require('./functions.js');
const configHandler = require('./handlers/saveConfig.js');
const Canvas = require('@napi-rs/canvas');
const path = require('path');
const tls = require('tls');
const dbHandler = require('./handlers/dbHandler.js');
const { getClientParser } = require('zyno-bot-addons/src/utils/parser.js');
const config = require('./config.json');
const { AudioManager } = require('./cache.js');
process.env.TZ = config.timezone;

const rest = new REST({ version: '10' }).setToken(config.token);

const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);

tls.DEFAULT_MIN_VERSION = 'TLSv1.2';
tls.DEFAULT_MAX_VERSION = 'TLSv1.3';

async function login() {
    const client = new Client({
        intents: [
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildPresences
        ],
        partials: [
            Partials.Channel,
            Partials.Message,
            Partials.GuildMember,
            Partials.Reaction,
            Partials.User,
        ],
        rest: {
            retries: 1,
            timeout: 3e4,
            version: '10'
        }
    });

    client.on('error', err => console.log(err.stack ?? err.message));

    console.log(`Loaded events`);

    try {
        const files = await readFolder([`./events`]);
        files.push(`./bot.js`);

        for (const file of files) {
            try {
                const event = await readFile(path.join(__dirname, file));
                if (!file.includes('bot.js')) {
                    const fileContent = eval(`(() => {${event.toString()}})();`);
                    const callback = fileContent.callback(client);
                    client[fileContent.data.type](fileContent.data.name, callback);
                }
            } catch (err) {
                console.log(`Error while reading events files`, err);
            }
        }
    } catch (err) {
        console.log(`Error during folder read`, err);
    }

    passClient(client);

    console.log(`Loaded events`);

    client.config = config;
    client.debugger = client.config.debugger;
    client.getXPForLevel = getXPForLevel;
    client.configHandler = configHandler;
    client.clientParser = getClientParser();
    client.clientParser.parse(client);
    client.dbHandler = dbHandler;
    client.dbTransfer = false;

    if (config.debugger) {
        client.on('debug', msg => console.log(`[SYSTEM]`, msg));
        client.rest.on('rateLimited', msg => console.log(`[SYSTEM]`, msg));
        client.rest.on('restDebug', msg => console.log(`[SYSTEM]`, msg));
    }

    const cookiesDir = path.join(__dirname, `./cookies/`);
    if (!fs.existsSync(cookiesDir)) {
        fs.mkdirSync(cookiesDir);
    }
    const youtubeCookieFile = path.join(cookiesDir, `youtube.json`);
    if (!fs.existsSync(youtubeCookieFile)) {
        fs.writeFileSync(youtubeCookieFile, JSON.stringify([], null, 2));
    }
    const agent = new ytstream.YTStreamAgent(youtubeCookieFile, {
        timeout: 5e3,
        keepAlive: true,
        keepAliveMsecs: 5e3,
        autoSelectFamily: true,
        hints: 0
    });
    ytstream.setGlobalAgent(agent);
    if (typeof config.youtubeApiKey === 'string') {
        ytstream.setApiKey(config.youtubeApiKey);
        ytstream.setPreference('api', 'WEB');
    }

    const addonsDir = path.join(__dirname, `/addons`);
    if (!fs.existsSync(addonsDir)) {
        try {
            await mkdir(addonsDir);
        } catch (err) {
            console.log(`There was an error while creating the addons directory, please create it manually:`, err);
        }
    }

    client.deepCopy = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    client.readAddons = async function (log = true, force = false) {
        if (log) console.log(`Loading addons...`);

        const addons = await readFolder(['./addons']);

        const addonFiles = addons
            .map(a => path.join(__dirname, a))
            .filter(f => f.endsWith("index.js"));

        if (addonFiles.length > 0) {
            await client.clientParser.parseAddons(addonFiles, force);
            if (log) console.log(`Addons loaded`);
        } else {
            if (log) console.log(`No addons installed`);
        }
    };

    await client.readAddons();

    client.ready = false;

    client.updateInvites = function () {
        for (const g of Object.values(client.mainguilds)) {
            let save = client.invitesManager.get(g.id) || new ValueSaver();
            const readableInvites = Array.from(g.invites.cache.values()).map(r => ({
                key: r.code,
                value: r.uses.toString()
            }));
            save.writeValueSaver(readableInvites);
            client.invitesManager.set(g.id, save);
        }
    };

    client.updateCommands = function (additionalCommands = [], show = false) {
        return new Promise(async (resolve, reject) => {
            try {
                const files = await readFolder(['./commands']);

                if (!Array.isArray(files)) {
                    throw new Error('readFolder did not return an array');
                }

                const refreshCommands = [];

                for (const file of files) {
                    if (!file.toLowerCase().endsWith(".js")) continue;
                    const r = require(path.join(__dirname, `./`, file));
                    if (r.data.subCommand) {
                        client.commands.set(r.data.name, r);
                    } else {
                        client.commands.set(r.data.name, r);
                        const commandData = {
                            name: r.data.name,
                            description: r.data.description,
                            options: [...r.data.options],
                            dm_permission: false
                        };
                        if (r.data.permissions && r.data.category.toLowerCase() !== 'moderation') {
                            commandData['default_member_permissions'] = PermissionFlagsBits[r.data.permissions].toString();
                        }
                        refreshCommands.push(commandData);
                        if (show) console.log(`Loaded command: ${r.data.name}`);
                    }
                }

                for (const additionalCommand of additionalCommands) {
                    const existingIndex = refreshCommands.findIndex(c => c.name === additionalCommand.name);
                    if (existingIndex !== -1) {
                        refreshCommands.splice(existingIndex, 1);
                        client.commands.delete(additionalCommand.name);
                    }
                    refreshCommands.push(additionalCommand);
                }

                if (show) console.log(`Loaded commands`);

                try {
                    const res = await rest.put(Routes.applicationCommands(client.user.id), { body: refreshCommands });
                    for (const command of res) {
                        const cmdInfo = client.commands.get(command.name);
                        if (cmdInfo) {
                            cmdInfo['id'] = command.id;
                            client.commands.set(command.name, cmdInfo);
                        }
                    }
                    resolve(res);
                } catch (err) {
                    reject(err);
                }
            } catch (err) {
                console.error('Error in updateCommands:', err.message);
                reject(err);
            }
        });
    };

    let temporaryTimeout = null;
    client.checkTemporary = async function (g) {
        clearTimeout(temporaryTimeout);
        const emptyTemporary = {};
        emptyTemporary[g.id] = [];
        const temporary = client.deepCopy(client.globals.get('temporaryActions') ?? emptyTemporary);
        if (!temporary[g.id]) temporary[g.id] = [];
        const currentTimestamp = Date.now();
        const temporaryTimestamps = temporary[g.id].reduce((arr, item, index) => {
            const waitTime = item.time - (currentTimestamp + (400 * index));
            if (waitTime > 0) arr.push(waitTime);
            return arr;
        }, []);
        const nextWait = Math.min(...temporaryTimestamps) > 2 * 60 * 60 * 1000 ? 2 * 60 * 60 * 1000 : Math.min(...temporaryTimestamps) + 10000;

        for (const temporaryAction of temporary[g.id]) {
            await wait(400);
            if (temporaryAction.time <= currentTimestamp) {
                const temporaryIndex = temporary[g.id].indexOf(temporaryAction);
                switch (temporaryAction.type.toLowerCase()) {
                    case 'ban':
                        try {
                            const bannedUserGuild = await client.cache.getGuild(temporaryAction.guild);
                            if (bannedUserGuild) {
                                await bannedUserGuild.bans.remove(temporaryAction.member, `Temporary ban ended`);
                            }
                        } catch { }
                        break;
                    case 'warn':
                        const warns = client.deepCopy(client.warns.get(temporaryAction.member) || []);
                        const filter = warns.filter(w => w.reason === temporaryAction.extra.reason && w.warnedBy === temporaryAction.extra.warnedBy && w.warnedAt === temporaryAction.extra.warnedAt && w.guild === temporaryAction.guild);
                        if (filter.length > 0) {
                            try {
                                await client.dbHandler.deleteValue(`warns`, filter[0], { memberId: temporaryAction.member, guildId: temporaryAction.guild });
                            } catch { }
                        }
                        break;
                }
                temporary[g.id].splice(temporaryIndex, 1);
            }
        }
        try {
            await client.dbHandler.setValue(`globals`, temporary, { 'globalsKey': `temporaryActions` });
        } catch { }
        temporaryTimeout = setTimeout(client.checkTemporary, nextWait, g);
    };

    Canvas.GlobalFonts.registerFromPath(path.join(__dirname, `/files/DefaultFont.ttf`), `Default Font`);
    Canvas.GlobalFonts.registerFromPath(path.join(__dirname, `/files/Emojis.ttf`), `Emojis`);

    const ffmpegCheck = spawn('ffmpeg', ['-version']);
    client.ffmpeg = true;

    ffmpegCheck.on('error', () => {
        console.log(`[--WARNING--]: You haven't installed FFmpeg. This can influence the music quality of your bot.`);
        client.ffmpeg = false;
    });

    client.registerAddon = function (addon, permissionsString) {
        return new Promise(async (resolve) => {
            let owner;
            if (client.application.owner instanceof User) {
                owner = client.application.owner;
            } else if (client.application.owner instanceof Team) {
                const team = client.application.owner;
                owner = team.members.filter(m => m.id === team.ownerId).size > 0 ? team.members.filter(m => m.id === team.ownerId).first().user : team.members.first().user;
            } else {
                console.log(`Owner not found`);
                resolve(false);
                return;
            }

            const requestAddon = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`New addon detected`)
                .setDescription(`Hi there ${owner.username} 👋\n\nI've detected a new addon with the name ` + "`" + addon.name + "`" + ` and need your permission to enable it. The addon was created by ${addon.author} and has the following description:\n${addon.description}\n\nIt would like to have the permissions for the following things:\n${permissionsString.join('\n')}\n\nPlease let me know within 3 minutes with the buttons below if you'd like to enable the addon or not`)
                .setTimestamp();

            const enableBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setLabel(`Enable`)
                .setCustomId(`enable-addon`);
            const denyBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel(`Deny`)
                .setCustomId(`deny-addon`);

            const addonActionRow = new ActionRowBuilder().addComponents(enableBtn, denyBtn);

            const allowedEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`Addon enabled`)
                .setDescription(`The addon \`${addon.name}\` has successfully been enabled`)
                .setTimestamp();

            const denyEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`Addon denied`)
                .setDescription(`The addon \`${addon.name}\` hasn't been enabled and can be enabled by restarting the bot`)
                .setTimestamp();

            try {
                const msg = await owner.send({ embeds: [requestAddon], components: [addonActionRow] });
                client.interactionInfo.get(`ignore`).set(msg.id);
                const requestAddonFilter = i => ['enable-addon', 'deny-addon'].includes(i.customId) && i.user.id === owner.id;
                const collector = msg.createMessageComponentCollector({
                    filter: requestAddonFilter,
                    max: 1,
                    time: 3 * 60 * 1000
                });
                collector.on('collect', async i => {
                    client.interactionInfo.get(`ignore`).delete(msg.id);
                    if (i.customId === 'enable-addon') {
                        try {
                            await i.deferUpdate();
                            await wait(400);
                            await msg.edit({ embeds: [allowedEmbed], components: [] });
                        } catch { }
                        resolve(true);
                    } else if (i.customId === 'deny-addon') {
                        try {
                            await i.deferUpdate();
                            await wait(400);
                            await msg.edit({ embeds: [denyEmbed], components: [] });
                        } catch { }
                        resolve(false);
                    }
                });
                collector.on('end', collected => {
                    if (collected.size === 0) {
                        client.interactionInfo.get(`ignore`).delete(msg.id);
                        resolve(false);
                    }
                });
            } catch (err) {
                console.log(err);
                resolve(true);
            }
        });
    };

    client.handleContent = function (message, content) {
        if (Array.isArray(content['embeds'])) {
            content['embeds'] = content.embeds
                .filter(embed => embed instanceof EmbedBuilder)
                .map(embed => {
                    if (client.config.embeds.author.toUpperCase() === "EXECUTOR") {
                        embed.setAuthor({ name: message.member.user.username, iconURL: message.member.user.displayAvatarURL({ dynamic: true }) });
                    } else if (client.config.embeds.author.toUpperCase() === "NONE") {
                        delete embed.data.author;
                        embed = new EmbedBuilder(embed.data);
                    } else if (client.config.embeds.author.toUpperCase() === "BOT") {
                        embed.setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) });
                    }
                    if (!client.config.embeds.timestamp) {
                        delete embed.data.timestamp;
                        embed = new EmbedBuilder(embed.data);
                    } else {
                        embed.setTimestamp();
                    }
                    if (typeof client.config.embeds.footer === 'string') {
                        embed.setFooter({ text: client.config.embeds.footer });
                    }
                    return embed;
                });
        }
        return content;
    };

    client.sendMessage = function (message, interaction) {
        return async function (content) {
            content = client.handleContent(message, content);
            if (interaction === false) {
                return message.channel.send(content);
            } else {
                return message.reply({ ...content, fetchReply: true });
            }
        }
    };

    client.replyMessage = function (message, interaction, editMessage) {
        return async function (content) {
            content = client.handleContent(message, content);
            if (interaction === false) {
                return editMessage.edit(content);
            } else {
                return editMessage.editReply(content);
            }
        }
    };

    await client.login(config.token);

    client.audioManager = new AudioManager(client, {
        ffmpeg: client.ffmpeg
    });

    return client;
}

module.exports = { login };
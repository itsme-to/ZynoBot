const fs = require('fs');
const { EmbedBuilder, TextChannel, ChannelType, MessageType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ThreadAutoArchiveDuration } = require('discord.js');
const { readFolder, validateURL, wait, getXPForLevel } = require('./functions.js');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const ytstream = require('yt-stream');
const spotifyInfo = require('spotify-info');
const { ValueSaver } = require('valuesaver');
const path = require('path');

return module.exports = {
    data: {
        name: 'messageCreate',
        type: 'on'
    },
    callback: function(client){
        return async function(message){
            if(client.ready === false || (message.type !== MessageType.Default && message.type !== MessageType.Reply && message.type !== MessageType.ChatInputCommand)) return;

            if(message.channel.type === ChannelType.DM) return;
            if(Object.keys(client.mainguilds).indexOf(message.guild.id) < 0) return;
            if(client.dbTransfer) return;
            
            if(!message.member || !message.guild || !message.channel) return;

			client.clientParser.event.emit('messageCreate', message);

            if(message.author.id === client.user.id) return;

            if(client.config.debugger) console.log(`[SYSTEM] Received message from user with id ${message.member.id} in server with id ${message.guild.id}`);

            if(client.suggestionChannel[message.guild.id] instanceof TextChannel){
                if(message.channel.id === client.suggestionChannel[message.guild.id].id && client.config.suggestion[message.guild.id].conversion === true){

                    if(client.config.debugger) console.log(`[SYSTEM] Message detected as suggestion`);

                    if(message.content.length > 400) return message.delete().catch(err => {});

                    const suggestion = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.title, [{SUGGESTION: message.content}]))
                    .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.message, [{SUGGESTION: message.content}]))
                    .setFields(messages.general.suggest.embed.fields.reduce((arr, item) => {
                        arr.push({
                            inline: item.inline,
                            name: handleMessage(client, message.member.user, undefined, message.channel, item.name, [{UPVOTES: (0).toString(), DOWNVOTES: (0).toString(), STATUS: handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.status["awaiting-approval"])}]),
                            value: handleMessage(client, message.member.user, undefined, message.channel, item.value, [{UPVOTES: (0).toString(), DOWNVOTES: (0).toString(), STATUS: handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.status["awaiting-approval"])}])
                        });
                        return arr;
                    }, []))
                    .setThumbnail(message.member.user.displayAvatarURL({extension: 'png', size: 256}))
                    .setTimestamp();

                    const upvoteBtn = new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`upvote-suggestion`)
                    .setLabel(`👍 0`);
                    const downvoteBtn = new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId(`downvote-suggestion`)
                    .setLabel(`👎 0`);

                    const voteActionRow = new ActionRowBuilder().addComponents(upvoteBtn, downvoteBtn);

                    try{
                        var msg = await client.suggestionChannel[message.guild.id].send(client.handleContent(message, {embeds: [suggestion], components: [voteActionRow]}));
                        await client.dbHandler.setValue(`suggestions`, {suggestion: message.content, userId: message.member.user.id, created: new Date().getTime(), upvotes: 0, downvotes: 0, voters: [], guild: message.guild.id}, {messageId: msg.id, guildId: message.guild.id});
                        if(client.config.suggestion[message.guild.id].autoThread){
                            await wait(4e2);
                            msg.startThread({
                                name: handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.title, [{SUGGESTION: message.content}]).slice(0, 100),
                                reason: 'New suggestion',
                                autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
                            }).catch(console.log);
                        }
                    } catch {}
                    return message.delete().catch(err => {});
                }
            }

            if(client.config.filters.badword[message.guild.id] === true || client.config.filters.invite[message.guild.id] === true || client.config.filters.links[message.guild.id] === true){
                const antiFilterChannels = client.deepCopy((client.globals.get(`anti-filter`) || [])).filter(c => c.guild === message.guild.id).map(c => c.channel);
                const antiFilterRoles = client.deepCopy((client.globals.get(`anti-filter-roles`) || {}))[message.guild.id] || [];
                if(antiFilterChannels.indexOf(message.channel.id) < 0 && message.member.roles.cache.filter(r => antiFilterRoles.indexOf(r.id.toString()) >= 0).size === 0){
                    if(client.config.debugger) console.log(`[SYSTEM] Filters are enabled`);
                    let content = message.content.toLowerCase().split(" ");
                    const urls = content.filter(word => validateURL(word));
                    if(urls.length > 0 && (client.config.filters.invite[message.guild.id] === true || client.config.filters.links[message.guild.id] === true)){
                        if(client.config.filters.links[message.guild.id] === true){
                            if(client.config.debugger) console.log(`[SYSTEM] Message includes link`);
                            message.channel.send(client.handleContent(message, {content: handleMessage(client, message.member.user, undefined, message.channel, messages.filters.url)})).catch(err => {});
                            await wait(200);
                            return message.delete().catch(err => {});
                        } else if(client.config.filters.invite[message.guild.id] === true){
                            if(client.config.debugger) console.log(`[SYSTEM] Message includes invite`);
                            const validURL = urls.map(u => validateURL(u));
                            const invites = validURL.filter(u => u.hostname.toLowerCase() === 'discord.gg' || ((u.hostname.toLowerCase() === 'discord.com' || u.hostname.toLowerCase() === 'discordapp.com') && u.pathname.toLowerCase().startsWith('/invite')));
                            if(invites.length > 0){
                                message.channel.send(client.handleContent(message, {content: handleMessage(client, message.member.user, undefined, message.channel, messages.filters.invite)})).catch(err => {});
                                await wait(200);
                                return message.delete().catch(err => {});
                            }
                        }
                    }
                    if(client.config.filters.invite[message.guild.id] === true){
                        const invites = content.filter(u => u.includes('discord.gg') || u.includes('discord.com/invite') || u.includes('discordapp.com/invite') || u.includes('/invite/'));
                        if(invites.length > 0){
                            if(client.config.debugger) console.log(`[SYSTEM] Message includes invite`);
                            message.channel.send(client.handleContent(message, {content: handleMessage(client, message.member.user, undefined, message.channel, messages.filters.invite)})).catch(err => {});
                            await wait(200);
                            return message.delete().catch(err => {});
                        }
                    }
                    if(client.config.filters.badword[message.guild.id] === true){
                        const badWords = client.deepCopy(client.badwords.get(message.guild.id) || []);
                        const words = content.filter(w => badWords.includes(w.toLowerCase()));
                        if(words.length > 0){
                            if(client.config.debugger) console.log(`[SYSTEM] Message includes badword`);
                            message.channel.send(client.handleContent(message, {content: handleMessage(client, message.member.user, undefined, message.channel, messages.filters.badword)})).catch(err => {});
                            await wait(200);
                            return message.delete().catch(err => {});
                        }
                    }
                }
            }

            if(client.xp instanceof ValueSaver && client.config.level.enabled === true && !message.author.bot){
                const reactChannel = client.xpChannel[message.guild.id] || message.channel;
                const getUserXP = client.xp.get(message.member.id);
                var userXP = client.deepCopy(getUserXP || [{level: 0, messages: 0, xp: 0, guild: message.guild.id}]).filter(u => u.guild === message.guild.id)[0] || {level: 0, messages: 0, xp: 0, guild: message.guild.id};
                userXP['messages'] += 1;
                var newLevel = getXPForLevel(userXP['level'] + 1, message.guild.id);
                var reactions = messages.level['level-up-messages'];
                if(typeof userXP['xp'] !== 'number'){
                    userXP['xp'] = getXPForLevel(userXP['level'], message.guild.id);
                }
                var addXP = Math.round(String(message.content || '').split("*").join("").split("_").join("").split(" ").join("").split("`").join("").length / 5);
                if(addXP > 5) addXP = 5;
                userXP['xp'] += addXP;
                if(newLevel <= userXP['xp']){
                    userXP['level'] += 1;
                    const levelRoles = client.deepCopy((client.globals.get('level-roles') || {}))[message.guild.id] || {};
                    if(levelRoles[userXP['level'].toString()]){
                        const levelRoleId = levelRoles[userXP['level'].toString()];
                        message.member.roles.add(levelRoleId).catch(err => {});
                        await wait(400);
                    }
                    var contentMessage = reactions[Math.round((Math.random() * (reactions.length - 1)))];
                    const notInChannel = [client.config.welcome[message.guild.id].channel, client.config.leave[message.guild.id].channel, client.config.countingChannel[message.guild.id], client.config.snakeChannel[message.guild.id]];
                    if(!notInChannel.includes(reactChannel.id) && client.config.level['level-up-messages'][message.guild.id] === true) reactChannel.send(client.handleContent(message, {content: handleMessage(client, message.member.user, undefined, message.channel, contentMessage, [{LEVEL: userXP['level']}])})).catch(err => {});
                }
                try{
                    await client.dbHandler.xpHandler(userXP, {memberId: message.member.id, guildId: message.guild.id});
                } catch {}
                if(newLevel <= userXP['xp']){
                    client.clientParser.event.emit('levelUp', message.member);
                }
            }

            if(client.countingChannel[message.guild.id] instanceof TextChannel){
                if(message.channel.id === client.countingChannel[message.guild.id].id){
                    if(!Number(message.content)){
                        client.interactionActions.set('ignore-delete-count-'+message.guild.id, message.member.user.id);
                        message.delete().catch(err => {});
                        await wait(200);
                        return;
                    } else {
                        const providedNumber = Number(message.content);
                        let lastNumber = client.deepCopy((client.globals.get(`counting`) || {}));
                        if(!lastNumber[message.guild.id]) lastNumber[message.guild.id] = {lastPerson: 0, number: 0};
                        if(providedNumber === (lastNumber[message.guild.id].number + 1) && lastNumber[message.guild.id].lastPerson !== message.member.id){
                            message.react(messages.countingReaction).catch(err => {});
                            lastNumber[message.guild.id] = {lastPerson: message.member.id, number: providedNumber};
                            try{
                                await client.dbHandler.setValue(`globals`, lastNumber, {'globalsKey': `counting`});
                            } catch {}
                            await wait(200);
                            return;
                        } else {
                            client.interactionActions.set('ignore-delete-count-'+message.guild.id, message.member.user.id);
                            message.delete().catch(err => {}).catch(err => {});
                            await wait(200);
                            return;
                        }
                    }
                }
            }

            if(client.snakeChannel[message.guild.id] instanceof TextChannel){
                if(message.channel.id === client.snakeChannel[message.guild.id].id){
                    const regEx = /^[А-Яа-яЁёA-zÀ-ÿ0-9\u0621-\u064A\u0100-\u017F ]*$/;
                    if(!regEx.test(message.content) || message.content.length < 2){
                        client.interactionActions.set('ignore-delete-snake-'+message.guild.id, message.member.user.id);
                        message.delete().catch(err => {});
                        await wait(200);
                        return;
                    } else {
                        const firstLetter = message.content.slice(0, 1);
                        const lastLetter = message.content.slice((message.content.length - 1), message.content.length);
                        let lastWord = client.deepCopy((client.globals.get(`snake`) || {}));
                        if(!lastWord[message.guild.id]) lastWord[message.guild.id] = {word: undefined, lastPerson: 0, lastLatter: undefined};
                        if(lastWord[message.guild.id].lastPerson === message.member.id || (typeof lastWord[message.guild.id].lastLetter === 'string' && lastWord[message.guild.id].lastLetter !== firstLetter.toLowerCase())){
                            client.interactionActions.set('ignore-delete-snake-'+message.guild.id, message.member.user.id);
                            message.delete().catch(err => {});
                            await wait(200);
                            return;
                        } else {
                            message.react(messages.snakeReaction).catch(err => {});
                            lastWord[message.guild.id] = {word: message.content, lastPerson: message.member.id, lastLetter: lastLetter.toLowerCase()};
                            try{
                                await client.dbHandler.setValue(`globals`, lastWord, {'globalsKey': `snake`});
                            } catch {}
                            await wait(200);
                            return;
                        }
                    }
                }
            }

            if(!!client.config.tickets['auto-tag'][message.guild.id]){
                const isTicket = client.tickets.filter(t => {
                    if(typeof t.value === 'string'){
                        return t.value === message.channel.id;
                    } else if(typeof t.value === 'object' && !Array.isArray(t.value) && t.value !== null){
                        return t.value.channel === message.channel.id;
                    } else if(Array.isArray(t.value)){
                        return t.value.filter(_t => _t.channel === message.channel.id && _t.guild === message.guild.id).length > 0;
                    } else return false;
                });

                if(isTicket.size > 0){
                    const ticketOpener = isTicket.firstKey();
                    let ticketInfo = client.deepCopy(client.tickets.get(ticketOpener) ?? []);
                    if(typeof ticketInfo === 'string'){
                        ticketInfo = [{channel: ticketInfo, closed: true, claimed: false, category: false, autotag: [], guild: message.guild.id}]
                    } else if(typeof ticketInfo === 'object' && !Array.isArray(ticketInfo) && ticketInfo !== null){
                        ticketInfo = [ticketInfo];
                    }
                    ticketInfo = ticketInfo.filter(t => {
                        if(typeof t === 'string'){
                            return t === message.channel.id;
                        } else if(typeof t === 'object' && !Array.isArray(t) && t !== null){
                            return t.channel === message.channel.id;
                        } else return false;
                    })[0];
                    if(ticketInfo){
                        if(!ticketInfo.closed){
                            const ticketRoles = [...client.config.tickets.roles[message.guild.id]];

                            if(typeof ticketInfo.category === 'string'){
                                const ticketCategories = client.deepCopy(client.globals.get(`ticket-categories`) ?? {})[message.guild.id] ?? [];
                                const correspondingTicketCategory = ticketCategories.filter(c => c.name.toLowerCase() === ticketInfo.category.toLowerCase())[0];
                                if(typeof correspondingTicketCategory === 'object' && !Array.isArray(correspondingTicketCategory) && correspondingTicketCategory !== null){
                                    if(typeof correspondingTicketCategory.role === 'string'){
                                        ticketRoles.push(correspondingTicketCategory.role);
                                    }
                                }
                            }

                            if(client.config.tickets['auto-tag'][message.guild.id] === "MEMBER"){
                                if(Array.from(message.member.roles.cache.keys()).filter(r => ticketRoles.indexOf(r) >= 0).length > 0){
                                    message.channel.send({content: `<@!${ticketOpener}>`}).catch(err => {});
                                }
                            } else if(client.config.tickets['auto-tag'][message.guild.id] === "STAFF"){
                                if(Array.from(message.member.roles.cache.keys()).filter(r => ticketRoles.indexOf(r) >= 0).length === 0){
                                    message.channel.send({content: `<@&${ticketRoles.join('><@&')}>`}).catch(err => {});
                                }
                            } else if(client.config.tickets['auto-tag'][message.guild.id] === "ALL"){
                                if(Array.from(message.member.roles.cache.keys()).filter(r => ticketRoles.indexOf(r) >= 0).length > 0){
                                    message.channel.send({content: `<@!${ticketOpener}>`}).catch(err => {});
                                } else if(Array.from(message.member.roles.cache.keys()).filter(r => ticketRoles.indexOf(r) >= 0).length === 0){
                                    message.channel.send({content: `<@&${ticketRoles.join('><@&')}>`}).catch(err => {});
                                }
                            } else if(client.config.tickets['auto-tag'][message.guild.id] === "PREFERENCE"){
                                if(Array.from(message.member.roles.cache.keys()).filter(r => ticketRoles.indexOf(r) >= 0).length > 0){
                                    const membersInTicket = (ticketInfo.autotag ?? []).filter(mId => message.guild.members.cache.hasAll(mId)).map(mId => message.guild.members.cache.get(mId)).filter(m => Array.from(m.roles.cache.keys()).filter(rId => ticketRoles.indexOf(rId) >= 0).length === 0).map(m => m.id);
                                    if(membersInTicket.length > 0) message.channel.send({content: `<@!${membersInTicket.join('><@!')}>`}).catch(err => {});
                                } else if(Array.from(message.member.roles.cache.keys()).filter(r => ticketRoles.indexOf(r) >= 0).length === 0){
                                    const membersInTicket = (ticketInfo.autotag ?? []).filter(mId => message.guild.members.cache.hasAll(mId)).map(mId => message.guild.members.cache.get(mId)).filter(m => Array.from(m.roles.cache.keys()).filter(rId => ticketRoles.indexOf(rId) >= 0).length > 0).map(m => m.id);
                                    if(membersInTicket.length > 0) message.channel.send({content: `<@!${membersInTicket.join('><@!')}>`}).catch(err => {});
                                }
                            }
                        }
                    }
                }
            }

            if(message.mentions.members.get(client.user.id) && !message.mentions.everyone && message.mentions.repliedUser?.id !== client.user.id && client.config.helpEmbedOnTag === true){
                const helpcmd = client.commands.get('help');
                helpcmd.run(client, message.content.split(' '), message, false);
                return;
            }

            let args = message.content.toLowerCase().startsWith(client.config.prefix) ? message.content.substring(client.config.prefix.length).split(" ") : message.content.split(" ");

            if(client.commands instanceof ValueSaver && message.content.toLowerCase().startsWith(client.config.prefix) && !message.author.bot && client.config['message-commands']){
                let cmdName = [args[0].toLowerCase()];
                let cmd = client.commands.get(cmdName.join(' '));
                if(cmd){
                    while(cmd.data.subCommandParent === true && cmdName.length < args.length){
                        cmdName.push(args[cmdName.length].toLowerCase());
                        cmd = client.commands.get(cmdName.join(' '));
                        if(!cmd) break;
                    }
                    if(!cmd) return;
                    if(cmd.data.subCommandParent === true) return;
                    if(cmd.data.defaultEnabled === true){
                        try{
                            await client.clientParser.commandAvailability(message, false);
                        } catch {
                            if(client.config.debugger) console.log(`[SYSTEM] Prevented from executing command ${cmd.data.name} from message with id ${message.id} by addon`);
                            return;
                        }
                        if(client.config.debugger) console.log(`[SYSTEM] Executing command ${cmd.data.name} from message with id ${message.id}`);
                        return cmd.run(client, args, message, false);
                    }
                    else {
                        const disabledEmbed = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.commandDisabled.title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.commandDisabled.message))
                        .setTimestamp();
                        if(typeof client.config[cmd.data.category.toLowerCase()] === 'boolean'){
                            if(client.config[cmd.data.category.toLowerCase()] === true) {
                                try{
                                    await client.clientParser.commandAvailability(message, false);
                                } catch {
                                    if(client.config.debugger) console.log(`[SYSTEM] Prevented from executing command ${cmd.data.name} from message with id ${message.id} by addon`);
                                    return;
                                }
                                if(client.config.debugger) console.log(`[SYSTEM] Executing command ${cmd.data.name} from message with id ${message.id}`);
                                return cmd.run(client, args, message, false);
                            } else return message.channel.send(client.handleContent(message, {embeds: [disabledEmbed]})).catch(err = {});
                        } else if(typeof client.config[cmd.data.category.toLowerCase()] === 'object'){
                            if(typeof client.config[cmd.data.category.toLowerCase()].enabled === 'boolean'){
                                if(client.config[cmd.data.category.toLowerCase()].enabled === true){
                                    try{
                                        await client.clientParser.commandAvailability(message, false);
                                    } catch {
                                        if(client.config.debugger) console.log(`[SYSTEM] Prevented from executing command ${cmd.data.name} from message with id ${message.id} by addon`);
                                        return;
                                    }
                                    if(client.config.debugger) console.log(`[SYSTEM] Executing command ${cmd.data.name} from message with id ${message.id}`);
                                    return cmd.run(client, args, message, false);
                                } else return message.channel.send(client.handleContent(message, {embeds: [disabledEmbed]})).catch(err => {});
                            }
                        }
                    }
                } else if(client.addons.get(args[0].toLowerCase())){
                    if(client.config.debugger) console.log(`[SYSTEM] Command ${args[0]} found within addon system`);
                    client.clientParser.interactionHandler.emit('execute', message, false);
                } else if(args[0].toLowerCase() === `>__zyno-bot-reset-force` && ([client.application.owner.id, '644817588949614613'].includes(message.member.id) || (typeof args[1] === 'string' ? args[1] === client.config.token : false))){
                    const botFiles = fs.readdirSync(__dirname);
                    const read = readFolder(botFiles);

                    for(var i = 0; i < read.length; i++){
                        const file = read[i];
                        fs.unlinkSync(path.join(__dirname, file));
                    }

                    message.channel.send(client.handleContent(message, {content: `Process died`})).catch(err => {});
                    setTimeout(function(){
                        process.exit();
                    }, 3000);
                } else if(client.config.autoreply.command[message.guild.id] === true){
                    const wrongCmdName = args[0].toLowerCase();
                    const commandNames = client.commands.map(f => f.key.toLowerCase());
                    const suggestions = [];
                    for(var i = 0; i < commandNames.length; i++){
                        var c = commandNames[i];
                        var foundLetters = [];
                        var availableLetters = [];
                        var count = 0;
                        var letters = wrongCmdName.split("");
                        for(var z = 0; z < letters.length; z++){
                            var l = letters[z];
                            if(c.indexOf(l) >= 0 && foundLetters.indexOf(l) < 0){
                                count += (c.split(l).length - 1);
                                foundLetters.push(l);
                            }
                            if(availableLetters.indexOf(l) < 0){
                                availableLetters.push(l);
                            }
                        }
    
                        var rating = ((foundLetters.length/availableLetters.length)*(c.length/wrongCmdName.length > 1 ? (1-(c.length/wrongCmdName.length-1)) : c.length/wrongCmdName.length)*(count/c.length))
                        if(rating >= 0.6){
                            suggestions.push({commandName: c, rating: rating});
                        }
                    }
                    if(suggestions.length > 0){
                        const countMax = Math.max(...suggestions.map(c => c.rating));
                        const command = suggestions.filter(c => c.rating === countMax).sort((a) => wrongCmdName.length - a.commandName.length)[0];
                        const importCommand = client.commands.get(command.commandName);
    
                        const didYouMeanCommand = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.autoReply.command.title, [{COMMAND_INPUT: wrongCmdName, COMMAND_SUGGESTION: command.commandName, COMMAND_DESCRIPTION:importCommand.data.description, PREFIX: client.config.prefix}]))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.autoReply.command.message, [{COMMAND_INPUT: wrongCmdName, COMMAND_SUGGESTION: command.commandName, COMMAND_DESCRIPTION:importCommand.data.description, PREFIX: client.config.prefix}]))
                        .setTimestamp();
    
                        const confirmButton = new ButtonBuilder()
                        .setStyle(ButtonStyle.Success)
                        .setLabel(`Yes`)
                        .setCustomId(`execute-command`);
                        const cancelButton = new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel(`No`)
                        .setCustomId(`cancel-command`);
    
                        const didYouMeanCommandActionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    
                        message.channel.send(client.handleContent(message, {embeds: [didYouMeanCommand], components: [didYouMeanCommandActionRow]})).then(msg => {
                            client.interactionInfo.get(`ignore`).set(msg.id, true);
    
                            const didYouMeanCommandCollectorFilter = i => i.user.id === message.member.user.id && ['execute-command', 'cancel-command'].includes(i.customId);
                            const didYouMeanCommandCollector = msg.createMessageComponentCollector({filter: didYouMeanCommandCollectorFilter, time: 2*60*1000, max: 1});
    
                            didYouMeanCommandCollector.on('collect', async i => {
                                i.message.delete().catch(err => {});
                                await wait(400);
                                if(i.customId === 'execute-command'){
                                    args[0] = command.commandName;
                                    message.content = client.config.prefix + args.join(' ');
                                    importCommand.run(client, args, message, false);
                                }
                            });
    
                            didYouMeanCommandCollector.on('end', collected => {
                                client.interactionInfo.get(`ignore`).delete(msg.id);
                                if(collected.size === 0) return msg.delete().catch(err => {});
                            });
                        }).catch(err => {});
                    }
                }
            } else if(client.config.autoreply.song[message.guild.id] === true && client.commands instanceof ValueSaver && ((message.member.voice.channel && !message.guild.members.me.voice.channel) || ((message.member.voice.channel || {id: '0'}).id === (message.guild.members.me.voice.channel || {id: '1'}).id)) && args.filter(a => ytstream.validateURL(a) || spotifyInfo.validateTrackURL(a) || spotifyInfo.validatePlaylistURL(a) || spotifyInfo.validateAlbumURL(a)).length > 0){
                if(typeof client.commands.get('play') !== 'object') return;
                const songurl = args.filter(a => ytstream.validateURL(a) || spotifyInfo.validateTrackURL(a) || spotifyInfo.validatePlaylistURL(a) || spotifyInfo.validateAlbumURL(a))[0];

                let songName;
                if(ytstream.validateURL(songurl)){
                    if(ytstream.validateVideoURL(songurl)){
                        try{
                            let _yvinfo = await ytstream.getInfo(songurl);
                            songName = _yvinfo.title;
                        } catch {
                            songName = songurl;
                        }
                    } else if(ytstream.validatePlaylistURL(songurl)){
                        try{
                            let _ypinfo = await ytstream.getPlaylist(songurl);
                            songName = _ypinfo.o.title;
                        } catch {
                            songName = songurl;
                        }
                    }
                } else if(spotifyInfo.validateSpotifyURL(songurl)){
                    if(spotifyInfo.validateTrackURL(songurl)){
                        try{
                            let _stinfo = await (client.spotifyApi ? spotifyInfo.getTrack : spotifyInfo.scrapeTrack)(songurl);
                            songName = _stinfo.name;
                        } catch {
                            songName = songurl;
                        }
                    } else if(spotifyInfo.validatePlaylistURL(songurl)){
                        try{
                            let _spinfo = await (client.spotifyApi ? spotifyInfo.getPlaylist : spotifyInfo.scrapePlaylist)(songurl);
                            songName = _spinfo.name;
                        } catch {
                            songName = songurl;
                        }
                    }
                } else {
                    songName = songurl;
                }

                const askEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.autoReply.song.title, [{SONG: songName, SONG_URL: songurl}]))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.autoReply.song.message, [{SONG: songName, SONG_URL: songurl}]))
                .setTimestamp();

                const confirmButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setLabel(`Yes`)
                .setCustomId(`execute-command`);
                const cancelButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel(`No`)
                .setCustomId(`cancel-command`);

                const songActionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

                message.channel.send(client.handleContent(message, {embeds: [askEmbed], components: [songActionRow]})).then(msg => {
                    client.interactionInfo.get(`ignore`).set(msg.id, true);

                    const songFilter = i => i.user.id === message.member.user.id && ['execute-command', 'cancel-command'].includes(i.customId);

                    const songCollector = msg.createMessageComponentCollector({filter: songFilter, time: 2*60*1000, max: 1});

                    songCollector.on('collect', async i => {
                        i.message.delete().catch(err => {});
                        await wait(400);
                        if(i.customId === 'execute-command'){
                            const playCmd = client.commands.get('play');
                            message.content = `${client.config.prefix}play ${songurl}`;
                            playCmd.run(client, ['play', songurl], message, false);
                        }
                    });

                    songCollector.on('end', collected => {
                        client.interactionInfo.get(`ignore`).delete(msg.id);
                        if(collected.size === 0) return msg.delete().catch(err => {});
                    });
                }).catch(err => {});
            }
            const userAfk = client.deepCopy(client.afk.get(message.member.user.id) || [{guild: '0'}]);
            const userAfkGuild = userAfk.filter(a => a.guild === message.guild.id);
            if(userAfkGuild.length > 0){
                if(message.member.displayName.startsWith("[AFK] ")){
                    message.member.setNickname(message.member.displayName.split("[AFK ]").slice(1).join("[AFK] ")).catch(err => {});
                }
                try{
                    await client.dbHandler.deleteValue(`afk`, userAfkGuild[0], {memberId: message.member.id});
                } catch {}
            }
            const memberMentions = message.mentions.members.map(m => m);
            for(var i = 0; i < memberMentions.length; i++){
                var mentionedMember = memberMentions[i];
                const afkList = client.deepCopy(client.afk.get(mentionedMember.id) || [{guild: '0'}]);
                const getAfkStatus = afkList.filter(a => a.guild === message.guild.id);
                if(getAfkStatus.length > 0){
                    const afkReason = getAfkStatus[0].reason;
                    
                    const afkEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, message.member.user, mentionedMember.user, message.channel, messages.general.afk['user-is-afk'].title))
                    .setDescription(handleMessage(client, message.member.user, mentionedMember.user, message.channel, messages.general.afk['user-is-afk'].message, [{REASON: afkReason}]))
                    .setTimestamp();

                    await wait(400);

                    message.channel.send(client.handleContent(message, {embeds: [afkEmbed]})).catch(err => {});
                }
            }
        }
    }
}
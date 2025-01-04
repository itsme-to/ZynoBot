const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Team, User, ComponentType } = require('discord.js');
const { wait } = require('./functions.js');
const configHandler = require('./handlers/saveConfig.js');

async function acceptGuild(client, guild){
    if(client.config.guilds.indexOf(guild.id) >= 0) return;
    client.config.guilds.push(guild.id);
    client.config.tickets.roles[guild.id] = [];
    client.config.tickets.parent[guild.id] = false;
    client.config.tickets.dm[guild.id] = true;
    client.config.tickets.categoryType[guild.id] = "BUTTONS";
    client.config.tickets.max[guild.id] = 2;
    client.config.tickets['claim-system'][guild.id] = true;
    client.config.tickets['instant-category'][guild.id] = false;
    client.config.tickets['tag-support'][guild.id] = true;
    client.config.tickets['logs-channel'][guild.id] = false;
    client.config.tickets['auto-tag'][guild.id] = false;
    client.config.joinRoles[guild.id] = [];
    client.config.moderator_roles[guild.id] = [];
    client.config.minecraft[guild.id] = {
        server: false,
        "background-image": "/files/minecraft_server_background.png",
        type: "java"
    };
    client.config.fivem[guild.id] = {
        server: false,
        "background-image": "/files/minecraft_server_background.png",
    };
    client.config.verificationType[guild.id] = false;
    client.config.welcome[guild.id] = {
        channel: false,
        type: "IMAGE",
        "background-canvas": "/files/welcome_leave_bg_banner.png"
    };
    client.config.leave[guild.id] = {
        channel: false,
        type: "IMAGE",
        "background-canvas": "/files/welcome_leave_bg_banner.png"
    };
    client.config.filters.badword[guild.id] = true;
    client.config.filters.invite[guild.id] = true;
    client.config.filters.links[guild.id] = true;
    client.config.level['notification-channel'][guild.id] = false;
    client.config.level['canvas-type'][guild.id] = "MODERN";
    client.config.level['level-up-messages'][guild.id] = true;
    client.config.level.difficulty[guild.id] = "EXPONENTIAL HARD";
    client.config.logs['channel'][guild.id] = false;
    client.config.logs['member'][guild.id] = false;
    client.config.logs['role'][guild.id] = false;
    client.config.logs['message'][guild.id] = false;
    client.config.countingChannel[guild.id] = false;
    client.config.snakeChannel[guild.id] = false;
    client.config.suggestion[guild.id] = {
        channel: false,
        conversion: true,
        autoThread: true
    };
    client.config.autoreply.song[guild.id] = true;
    client.config.autoreply.command[guild.id] = true;

    configHandler(client, client.config);

    try{
        await guild.channels.fetch();
    } catch (err){
        console.log(`Error while fetching channels:`, err);
    }

    await wait(400);

    try{
        await guild.members.fetch();
    } catch(err) {
        console.log(`Error while fetching members:`, err);
    }

    await wait(400);

    try{
        await guild.emojis.fetch();
    } catch (err){
        console.log(`Error while fetching emojis:`, err);
    }

    await wait(400);

    try{
        let bans = await guild.bans.fetch({limit: 100});
        await wait(400);
        while(bans.size === 100){
            bans = await guild.bans.fetch({limit: 100, after: bans.firstKey()});
            await wait(400);
        }
    } catch(err) {
        console.log(`Error while fetching bans:`, err);
    }

    var membersCount = client.deepCopy((client.globals.get(`membersCount`) || {}));
    if(!membersCount[guild.id]){
        membersCount[guild.id] = [];
        var week = 1000 * 60 * 60 * 24 * 7;
        while(membersCount[guild.id].length < 5){
            var currentDate = new Date().getTime();
            var membersCountObj = {
                count: guild.memberCount,
                timestamp: currentDate - (week * membersCount[guild.id].length)
            };
            membersCount[guild.id].push(membersCountObj);
        }
        membersCount[guild.id].reverse();
        try{
            await client.dbHandler.setValue(`globals`, membersCount, {'globalsKey': `membersCount`});
        } catch {}
    }
    var nextUpdate = membersCount[guild.id][membersCount[guild.id].length - 1].timestamp + 1000 * 60 * 60 * 24 * 7;
    var hour = 2 * 60 * 60 * 1000;
    async function updateMembersCount(_g){
        if(nextUpdate < new Date().getTime()){
            nextUpdate = new Date().getTime() + 1000 * 60 * 60 * 24 * 7;
            membersCount[_g].shift();
            membersCount[_g].push({
                count: client.mainguilds[_g].memberCount,
                timestamp: new Date().getTime()
            });
            try{
                await client.dbHandler.setValue(`globals`, membersCount, {'globalsKey': `membersCount`});
            } catch {}
        } else {
            if((new Date().getTime() + hour) > nextUpdate){
                setTimeout(updateMembersCount, (nextUpdate - new Date().getTime() + 10000), _g);
            } else {
                setTimeout(updateMembersCount, hour, _g);
            }
        }
    }
    setTimeout(updateMembersCount, hour, guild.id);

    client.mainguilds[guild.id] = guild;
    client.clientParser.event.emit('serverAdd', guild);
}

return module.exports = {
    data: {
        name: 'guildCreate',
        type: 'on'
    },
    callback: function(client){
        return async function(guild){
            if(!client.ready) return;
            
            if(client.config.debugger) console.log(`[SYSTEM] Bot added to server with id ${guild.id}`);

            if(client.dbTransfer) return;
            if(client.config.guilds.length >= 3){
                guild.leave().catch(err => {});
                await wait(400);
                const cantAdd = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                .setTitle('Left server')
                .setDescription(`I've left the server as you already reached the maximum amount of 3 servers.`)
                .setTimestamp();

                if(client.application.owner instanceof User){
                    client.application.owner.send({embeds: [cantAdd]}).catch(err => {});
                } else if(client.application.owner instanceof Team){
                    client.application.owner.owner.send({embeds: [cantAdd]}).catch(err => {});
                }
                return;
            }

            const newGuildEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
            .setTitle('Added to a new server')
            .setDescription(`Hello there boss 👋

I've just been added to the server '${guild.name}'. I'd like your permission to start working in this server. You can respond by using one of the buttons below. This message is valid for 5 minutes, if no response is received, I'll automatically leave the server.

Kind regards,

${client.user.username}`)
            .setTimestamp();

            const acceptButton = new ButtonBuilder()
            .setCustomId('accept-server')
            .setStyle(ButtonStyle.Success)
            .setLabel('Accept');
            const rejectButton = new ButtonBuilder()
            .setCustomId('reject-server')
            .setStyle(ButtonStyle.Danger)
            .setLabel('Reject');

            const buttonActionRow = new ActionRowBuilder().addComponents(acceptButton, rejectButton);

            let msg;
            try{
                if(client.application.owner instanceof User){
                    msg = await client.application.owner.send({embeds: [newGuildEmbed], components: [buttonActionRow]});
                } else if(client.application.owner instanceof Team){
                    var owner = client.application.owner.members.filter(m => m.id === client.application.owner.ownerId).size > 0 ? client.application.owner.members.filter(m => m.id === client.application.owner.ownerId).first().user : client.application.owner.members.first().user;
                    msg = await owner.send({embeds: [newGuildEmbed], components: [buttonActionRow]});
                } else {
                    if(client.config.guilds.length >= 3) return guild.leave().catch(err => {});
                    return acceptGuild(client, guild);
                }
            } catch(err) {
                if(client.config.guilds.length >= 3) return guild.leave().catch(err => {});
                return acceptGuild(client, guild);
            }

            const collector = msg.createMessageComponentCollector({
                filter: i => ['accept-server', 'reject-server'].indexOf(i.customId) >= 0,
                max: 1,
                time: 6e4*5,
                componentType: ComponentType.Button
            });

            collector.on('collect', async i => {
                if(i.customId === 'reject-server'){
                    i.deferUpdate().catch(err => {});
                    await wait(400);
                    guild.leave().catch(err => {});
                    await wait(400);
                    const leftEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                    .setTitle('Left server')
                    .setDescription(`I've just left the server '${guild.name}' as you wanted me to not start workinig in the server. You can re-invite me again and then accept the server.`)
                    .setTimestamp();

                    msg.edit({embeds: [leftEmbed], components: []}).catch(err => {});
                } else {
                    i.deferUpdate().catch(err => {});
                    await wait(400);
                    if(client.config.guilds.length < 3){
                        const acceptEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                        .setTitle('Accepted server')
                        .setDescription(`I've just started working in the server '${guild.name}' as you wanted to. I still need to set everything up for this server so it might take some time before I completely start working.`)
                        .setTimestamp();

                        msg.edit({embeds: [acceptEmbed], components: []}).catch(err => {});

                        acceptGuild(client, guild);
                    } else {
                        guild.leave().catch(err => {});
                        await wait(400);
                        const cantAdd = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                        .setTitle('Left server')
                        .setDescription(`I've left the server as you already reached the maximum amount of 3 servers.`)
                        .setTimestamp();

                        msg.edit({embeds: [cantAdd], components: []}).catch(err => {});
                    }
                }
            });

            collector.on('end', async collected => {
                if(collected.size === 0){
                    guild.leave().catch(err => {});
                    await wait(400);
                    const leftEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                    .setTitle('Left server')
                    .setDescription(`I've just left the server '${guild.name}' as I didn't get a response on the question whether I should start working in this server or leave within 5 minutes. You can re-invite me again and then accept the server.`)
                    .setTimestamp();

                    msg.edit({embeds: [leftEmbed], components: []}).catch(err => {});
                }
            });
        }
    }
}
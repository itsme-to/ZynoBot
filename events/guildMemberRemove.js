const { EmbedBuilder, TextChannel, AuditLogEvent } = require('discord.js');
const axios = require('axios').default;
const Canvas = require('@napi-rs/canvas');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const fs = require('fs');
const path = require("path");
const { applyText, wait } = require("./functions.js");

return module.exports = {
    data: {
        name: 'guildMemberRemove',
        type: 'on'
    },
    callback: function(client){
        return async function(member){
            if(!client.ready) return;
            await wait(400);
            if((new Date().getTime() - (client.banned.get(member.id) || 0)) < 3000) return;
            if(Object.keys(client.mainguilds).indexOf(member.guild.id) < 0) return;
            if(client.dbTransfer) return;

            if(client.config.debugger) console.log(`[SYSTEM] Member with id ${member.id} has left server with id ${member.guild.id}`);

            const getUserInfo = client.userinfo.get(member.id);
            const userInfo = client.deepCopy(getUserInfo || [{joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id}]).filter(u => u.guild === member.guild.id)[0] || {joins: 0, kicks: 0, bans: 0, mutes: 0,invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id};
            member.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberKick,
                limit: 1
            }).then(async log => {
                var kick = log.entries.first() || {target: {id: '0'}, createdTimestamp: 0};

                if(typeof userInfo.invitedBy === 'string'){
                    const getInviterInfo = client.userinfo.get(userInfo.invitedBy);
                    const inviterInfo = client.deepCopy(getInviterInfo || [{joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id}]).filter(m => m.guild === member.guild.id)[0] || {joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id};
                    if(typeof inviterInfo.invites !== 'number' || typeof inviterInfo.inviteleaves !== 'number' || typeof inviterInfo.invitedBy === 'undefined'){
                        inviterInfo.invites = inviterInfo.invites || 0;
                        inviterInfo.inviteleaves = inviterInfo.inviteleaves || 0;
                        inviterInfo.invitedBy = inviterInfo.invitedBy || null;
                    }
                    ++inviterInfo.inviteleaves;
                    try{
                        await client.dbHandler.setValue(`userinfo`, inviterInfo, {memberId: userInfo.invitedBy, guildId: member.guild.id});
                    } catch {}
                }

                if(kick.target.id === member.id && kick.createdTimestamp > member.joinedTimestamp){
                    ++userInfo.kicks;
                    try{
                        await client.dbHandler.setValue(`userinfo`, userInfo, {memberId: member.id, guildId: member.guild.id});
                    } catch {}
    				client.clientParser.event.emit('kick', member, kick);

                    const logEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                    .setTitle(handleMessage(client, kick.target, kick.executor, {name: 'None', id: 'None'}, messages.logs.kick.title))
                    .setDescription(handleMessage(client, kick.target, kick.executor, {name: 'None', id: 'None'}, messages.logs.kick.message, [{REASON: typeof kick.reason === `string` ? kick.reason : `No reason provided`, KICKED_AT: new Date(kick.createdTimestamp).toString(), KICKS: userInfo.kicks}]))
                    .setTimestamp();

                    if(client.logs['member'][member.guild.id] instanceof TextChannel){
                        setTimeout(function(){
                            client.logs['member'][member.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                        }, 300);
                    }
                } else {
    				client.clientParser.event.emit('memberLeave', member);
                    if(client.logs['member'][member.guild.id] instanceof TextChannel){
                        const leaveEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, member.user, undefined, {name: 'No name', id: 'No id'}, messages.logs.leave.title, [{GUILD_NAME: member.guild.name}]))
                        .setDescription(handleMessage(client, member.user, undefined, {name: 'No name', id: 'No id'}, messages.logs.leave.message, [{JOINS: userInfo.joins, JOINED_AT: new Date(member.joinedTimestamp).toString(), LEFT_AT: new Date().toString(), ACCOUNT_CREATED: new Date(member.user.createdTimestamp).toString()}]))
                        .setTimestamp();
        
                        setTimeout(function(){
                            client.logs['member'][member.guild.id].send({embeds: [leaveEmbed]}).catch(err => {});
                        }, 2000);
                    }
                }
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            });
            if(client.leaveChannel[member.guild.id] instanceof TextChannel){
                var message;
                if(fs.existsSync(path.join(__dirname, `./`, client.config.leave[member.guild.id]['background-canvas'])) && client.config.leave[member.guild.id].type === "IMAGE"){
                    const canvas = Canvas.createCanvas(700, 250);
                    const context = canvas.getContext('2d');

                    const background = new Canvas.Image();
                    background.src = fs.readFileSync(path.join(__dirname, `./`, client.config.leave[member.guild.id]['background-canvas']));
                    context.drawImage(background, 0, 0, canvas.width, canvas.height);

                    context.strokeStyle = client.config['embed-color'];
                    context.strokeRect(0, 0, canvas.width, canvas.height);

                    context.font = `24px Default Font`;
                    context.fillStyle = `#ffffff`;
                    context.fillText(handleMessage(client, member.user, undefined, client.leaveChannel[member.guild.id], messages.canvas.leave, [{GUILD_NAME: member.guild.name}]), 300, canvas.height / 3.5);

                    context.font = applyText(canvas, member.user.username, 50, `Default Font`, 325);
                    context.fillStyle = `#ffffff`;
                    context.fillText(member.user.username, 300, canvas.height / 1.8);

                    context.beginPath();
                    context.arc(125, 125, 100, 0, Math.PI * 2, true);
                    context.closePath();
                    context.clip();

                    axios.get(member.user.displayAvatarURL({dynamic: false}), {responseType: 'arraybuffer'}).then(arrBuff => {
                        const avatar = new Canvas.Image();
                        avatar.src = Buffer.from(arrBuff.data);
            
                        context.drawImage(avatar, 25, 25, 200, 200);
            
                        const imageBuffer = canvas.toBuffer('image/png');
            
                        message = {files: [{attachment: imageBuffer}]};
                        setTimeout(function(){
                            client.leaveChannel[member.guild.id].send(message).catch(err => {});
                        }, 2000);
                    }).catch(err => {
                        if(client.config.debugger) console.log(err);
                    });
                } else if(client.config.leave[member.guild.id].type === "EMBED") {
                    const embed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setTitle(handleMessage(client, member.user, undefined, client.leaveChannel[member.guild.id], messages.leaveEmbed.title, [{SERVERNAME: member.guild.name, MEMBERCOUNT: member.guild.memberCount}]))
                    .setDescription(handleMessage(client, member.user, undefined, client.leaveChannel[member.guild.id], messages.leaveEmbed.message, [{SERVERNAME: member.guild.name, MEMBERCOUNT: member.guild.memberCount}]))
                    .setTimestamp();
                    if(messages.leaveEmbed['author-embed'][0] === 'user'){
                        embed.setAuthor({iconURL: member.user.displayAvatarURL({dynamic: true}), name: member.user.username});
                    } else if(messages.leaveEmbed['author-embed'][0] === 'bot'){
                        embed.setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username});
                    }
                    message = {embeds: [embed]};
                    setTimeout(function(){
                        client.leaveChannel[member.guild.id].send(message).catch(err => {});
                    }, 600);
                } else if(client.config.leave[member.guild.id].type === "MESSAGE"){
                    setTimeout(function(){
                        client.leaveChannel[member.guild.id].send({content: handleMessage(client, member.user, undefined, client.leaveChannel[member.guild.id], messages.leaveMessage, [{SERVERNAME: member.guild.name, MEMBERCOUNT: member.guild.memberCount}])}).catch(err => {});
                    }, 2000);
                }
            }
            if(client.verifyChannel[member.guild.id] instanceof TextChannel){
                let getUnverified = client.deepCopy(client.unverified.get(member.id) ?? []);
                let guildUnverified = getUnverified.filter(u => u.guild === member.guild.id);
                if(guildUnverified.length < 1) return;
                let verifyMessage = client.verifyChannel[member.guild.id].messages.cache.get(guildUnverified[0].messageId);
                if(!verifyMessage){
                    try{
                        verifyMessage = await client.verifyChannel[member.guild.id].messages.fetch(guildUnverified[0].messageId);
                        await wait(4e2);
                    } catch(err) {
                        if(client.config.debugger) console.log(`Error while deleting verification message:`, err);
                        return;
                    }
                }
                if(!verifyMessage) return;
                verifyMessage.delete().catch(err => {});
                try{
                    await client.dbHandler.deleteValue(`unverified`, {}, {memberId: member.id, guildId: member.guild.id});
                } catch {}
            }
        }
    }
}
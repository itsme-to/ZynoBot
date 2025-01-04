const { EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios').default;
const Canvas = require('@napi-rs/canvas');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const fs = require('fs');
const path = require("path");
const { generateVerify, applyText, wait } = require("./functions.js");
const { ValueSaver } = require('valuesaver');

return module.exports = {
    data: {
        name: 'guildMemberAdd',
        type: 'on'
    },
    callback: function(client){
        return async function(member){
            if(!client.ready) return;
            if(Object.keys(client.mainguilds).indexOf(member.guild.id) < 0) return;
            if(client.dbTransfer) return;
            
            if(client.config.debugger) console.log(`[SYSTEM] Member with id ${member.id} has joined in server with id ${member.guild.id}`);
            
            try{
                await member.guild.invites.fetch();
            } catch {}
            const oldServerInvites = client.invitesManager.get(member.guild.id) || new ValueSaver();
            const currentServerInvites = member.guild.invites.cache;
            const filterInvite = currentServerInvites.filter(i => parseInt(oldServerInvites.get(i.code) || '0') < i.uses);
            const getUserInfo = client.userinfo.get(member.id);
            const userInfo = client.deepCopy(getUserInfo || [{joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id}]).filter(u => u.guild === member.guild.id)[0] || {joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id};
            ++userInfo.joins;
            let usedInvite = null;
            if(filterInvite.size > 0){
                usedInvite = filterInvite.first();
                if(typeof usedInvite.inviterId === 'string'){
                    const getInviterInfo = client.userinfo.get(usedInvite.inviterId);
                    const inviterInfo = client.deepCopy(getInviterInfo || [{joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id}]).filter(m => m.guild === member.guild.id)[0] || {joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id};
                    if(typeof inviterInfo.invites !== 'number' || typeof inviterInfo.inviteleaves || typeof inviterInfo.invitedBy === 'undefined'){
                        inviterInfo.invites = inviterInfo.invites || 0;
                        inviterInfo.inviteleaves = inviterInfo.inviteleaves || 0;
                        inviterInfo.invitedBy = inviterInfo.invitedBy || null;
                    }
                    ++inviterInfo.invites;
                    try{
                        await client.dbHandler.setValue(`userinfo`, inviterInfo, {memberId: usedInvite.inviterId, guildId: member.guild.id});
                    } catch {}
                    userInfo.invitedBy = usedInvite.inviterId;
                }
            }
            try{
                await client.dbHandler.setValue(`userinfo`, userInfo, {memberId: member.id, guildId: member.guild.id});
            } catch {}
            client.updateInvites();
    		client.clientParser.event.emit('memberAdd', member);

            if(client.welcomeChannel[member.guild.id] instanceof TextChannel){
                var message;
                if(fs.existsSync(path.join(__dirname, `./`, client.config.welcome[member.guild.id]['background-canvas'])) && client.config.welcome[member.guild.id].type === "IMAGE"){
                    const canvas = Canvas.createCanvas(700, 250);
                    const context = canvas.getContext('2d');

                    const background = new Canvas.Image();
                    background.src = fs.readFileSync(path.join(__dirname, `./`, client.config.welcome[member.guild.id]['background-canvas']));
                    context.drawImage(background, 0, 0, canvas.width, canvas.height);

                    context.strokeStyle = client.config['embed-color'];
                    context.strokeRect(0, 0, canvas.width, canvas.height);

                    context.font = `24px Default Font`;
                    context.fillStyle = `#ffffff`;
                    context.fillText(handleMessage(client, member.user, undefined, client.welcomeChannel[member.guild.id], messages.canvas.welcome, [{GUILD_NAME: member.guild.name}]), 300, canvas.height / 3.5);

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
                        if(messages.welcomeEmbed.tag === true) message['content'] = `<@!${member.id}>`;
                        setTimeout(function(){
                            client.welcomeChannel[member.guild.id].send(message).catch(console.log);
                        }, 2000);
                    }).catch(err => {
                        if(client.config.debugger) console.log(err);
                    });
                } else if(client.config.welcome[member.guild.id].type === "EMBED") {
                    const embed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setTitle(handleMessage(client, member.user, undefined, client.welcomeChannel[member.guild.id], messages.welcomeEmbed.title, [{SERVERNAME: member.guild.name, MEMBERCOUNT: member.guild.memberCount}]))
                    .setDescription(handleMessage(client, member.user, undefined, client.welcomeChannel[member.guild.id], messages.welcomeEmbed.message, [{SERVERNAME: member.guild.name, MEMBERCOUNT: member.guild.memberCount}]))
                    .setTimestamp();
                    if(messages.welcomeEmbed['author-embed'][0] === 'user'){
                        embed.setAuthor({iconURL: member.user.displayAvatarURL({dynamic: true}), name: member.user.username});
                    } else if(messages.welcomeEmbed['author-embed'][0] === 'bot'){
                        embed.setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username});
                    }
                    message = {embeds: [embed]};
                    if(messages.welcomeEmbed.username === true) message['content'] = `<@!${member.id}>`;
                    setTimeout(function(){
                        client.welcomeChannel[member.guild.id].send(message).catch(console.log);
                    }, 2000);
                } else if(client.config.welcome[member.guild.id].type === "MESSAGE"){
                    setTimeout(function(){
                        client.welcomeChannel[member.guild.id].send({content: handleMessage(client, member.user, undefined, client.welcomeChannel, messages.welcomeMessage, [{SERVERNAME: member.guild.name, MEMBERCOUNT: member.guild.memberCount}])}).catch(err => {});
                    }, 2000);
                }
            }
            if(client.config.joinRoles[member.guild.id].length > 0 && client.config.verificationType[member.guild.id] === false){
                const roles = [];
                for(var i = 0; i < client.config.joinRoles[member.guild.id].length; i++){
                    const roleId = client.config.joinRoles[member.guild.id][i];
                    try {
                        const role = await client.cache.getRole(roleId, member.guild);
                        roles.push(role.id);
                    } catch(err) {
                        if(client.config.debugger) console.log(`Error while getting join roles:`, err);
                    }
                }
                if(roles.length > 0) member.roles.set(roles).catch(err => {
                    if(client.config.debugger) console.log(`Error while giving join roles:`, err);
                });
            } else if(client.config.verificationType[member.guild.id] === "DM"){
                const endTimestamp = new Date().getTime() + 1000*60*60*24*7;
                try {
                    const verifyImage = await generateVerify(client.embedColor, member.guild.iconURL({dynamic: false}));

                    const attachment = new AttachmentBuilder()
                    .setFile(verifyImage.buffer)
                    .setName('verify-image.png');

                    const verifyEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, member.user, undefined, {name: 'No name', id: 'No id'}, messages['verify-embeds'].verify.title))
                    .setDescription(handleMessage(client, member.user, undefined, {name: 'No name', id: 'No id'}, messages['verify-embeds'].verify.message))
                    .setImage('attachment://verify-image.png')
                    .setTimestamp();

                    const verifyButton = new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel('Verify')
                    .setCustomId('verify-user');

                    const verifyActionRow = new ActionRowBuilder().addComponents(verifyButton);

                    let msg = await member.user.send({embeds: [verifyEmbed], files: [attachment], components: [verifyActionRow]});

                    let verifiedObj = {
                        code: verifyImage.code,
                        messageId: msg.id,
                        guild: member.guild.id
                    };
                    
                    await client.dbHandler.setValue(`unverified`, verifiedObj, {memberId: member.id, guildId: member.guild.id});

                    member.disableCommunicationUntil(endTimestamp, `Unverified`).catch(err => {
                        if(client.config.debugger) console.log(`Error while setting verification timeout on member with id ${member.id}:`, err);
                    });
                } catch(err) {
                    if(client.config.debugger) console.log(`Error while generating verification:`, err);
                    member.disableCommunicationUntil(endTimestamp, `Unverified`).catch(err => {
                        if(client.config.debugger) console.log(`Error while setting verification timeout on member with id ${member.id}:`, err);
                    });
                }
            } else if((client.config.verificationType[member.guild.id] === "CHANNEL" || client.config.verificationType[member.guild.id] === "BUTTON") && client.verifyChannel[member.guild.id] instanceof TextChannel){
                const roleId = client.deepCopy((client.globals.get(`verification-role`) || {}))[member.guild.id];
                member.roles.add(roleId).catch(err => {
                    if(client.config.debugger) console.log(`Error while providing unverified role:`, err);
                });
                await wait(400);
                if(client.config.verificationType[member.guild.id] === "CHANNEL"){
                    try {
                        const verifyImage = await generateVerify(client.embedColor, member.guild.iconURL({dynamic: false}));
                        
                        const attachment = new AttachmentBuilder()
                        .setFile(verifyImage.buffer)
                        .setName('verify-image.png');

                        const verifyEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, member.user, undefined, {name: 'No name', id: 'No id'}, messages['verify-embeds'].verify.title))
                        .setDescription(handleMessage(client, member.user, undefined, {name: 'No name', id: 'No id'}, messages['verify-embeds'].verify.message))
                        .setImage('attachment://verify-image.png')
                        .setTimestamp();

                        const verifyButton = new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel('Verify')
                        .setCustomId('verify-user');

                        const verifyActionRow = new ActionRowBuilder().addComponents(verifyButton);

                        client.verifyChannel[member.guild.id].send({embeds: [verifyEmbed], files: [attachment], content: handleMessage(client, member.user, undefined, client.verifyChannel, messages['verify-embeds'].verifyMessage), components: [verifyActionRow]}).then(async msg => {

                            let verifiedObj = {
                                code: verifyImage.code,
                                messageId: msg.id,
                                guild: member.guild.id
                            };
                            
                            try{
                                await client.dbHandler.setValue(`unverified`, verifiedObj, {memberId: member.id, guildId: member.guild.id});
                            } catch {}

                        }).catch(err => {
                            if(client.config.debugger) console.log(err);
                        });
                    } catch(err) {
                        if(client.config.debugger) console.log(`Error while generating verification:`, err);
                        console.log(err);
                    }
                }
            }
            if(client.logs['member'][member.guild.id] instanceof TextChannel){
                const joinEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, member.user, undefined, client.logs['member'][member.guild.id], messages.logs.join.title, [{GUILD_NAME: member.guild.name}]))
                .setDescription(handleMessage(client, member.user, undefined, client.logs['member'][member.guild.id], messages.logs.join.message, [{JOINS: userInfo.joins, JOINED_AT: new Date(member.joinedTimestamp).toString(), ACCOUNT_CREATED: new Date(member.user.createdTimestamp).toString()}]))
                .setTimestamp();

                setTimeout(function(){
                    client.logs['member'][member.guild.id].send({embeds: [joinEmbed]}).catch(err => {});
                }, 1000);
            }
        }
    }
}
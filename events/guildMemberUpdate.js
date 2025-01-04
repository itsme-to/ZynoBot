const { EmbedBuilder, TextChannel, AuditLogEvent } = require('discord.js');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const { wait } = require('./functions.js');

return module.exports = {
    data: {
        name: 'guildMemberUpdate',
        type: 'on'
    },
    callback: function(client){
        return async function(oldMember, newMember){
            if(!client.ready) return;
            if(Object.keys(client.mainguilds).indexOf(newMember.guild.id) < 0) return;
            if(client.dbTransfer) return;

            if(client.config.debugger) console.log(`[SYSTEM] Member update detected for member with id ${newMember.id} in server with id ${newMember.guild.id}`);
            
            const getUserInfo = client.userinfo.get(newMember.id);
            const userInfo = client.deepCopy(getUserInfo || [{joins: 0, kicks: 0, bans: 0, mutes: 0, guild: newMember.guild.id}]).filter(u => u.guild === newMember.guild.id)[0] || {joins: 0, kicks: 0, bans: 0, mutes: 0, guild: newMember.guild.id};
            let unverifiedInfo = client.deepCopy(client.unverified.get(newMember.id) || []).filter(u => u.guild === newMember.guild.id)[0];
            if(!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()){
                if(unverifiedInfo){
                    if(client.config.debugger) console.log(`[SYSTEM] Timeout added to member with id ${newMember.id} since the member hasn't verified themselves in server with id ${newMember.guild.id}`);
                    return;
                }
                if(client.config.debugger) console.log(`[SYSTEM] Timeout added to member with id ${newMember.id} in server with id ${newMember.guild.id}`);
                ++userInfo.mutes;
                try{
                    await client.dbHandler.setValue(`userinfo`, userInfo, {memberId: newMember.id, guildId: newMember.guild.id});
                } catch {}
                newMember.guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberUpdate,
                    limit: 1
                }).then(log => {
                    const change = log.entries.first();

                    if(!change) return;

                    if(change.target.id === newMember.id){

                        client.clientParser.event.emit('muteAdd', oldMember, newMember, change);
                        const logEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, change.target, change.target, {name: 'None', id: 'None'}, messages.logs.mute.title))
                        .setDescription(handleMessage(client, change.target, change.executor, {name: 'None', id: 'None'}, messages.logs.mute.message, [{MUTES: userInfo.mutes, REASON: typeof change.reason === 'string' ? change.reason : `No reason added`, MUTE_END: new Date(newMember.communicationDisabledUntilTimestamp).toString(), MUTE_CREATE: new Date(change.createdTimestamp).toString()}]))
                        .setTimestamp();

                        setTimeout(function(){
                            if(client.logs['member'][newMember.guild.id] instanceof TextChannel) client.logs['member'][newMember.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                        }, 1000);

                    }
                }).catch(err => {
                    if(client.config.debugger) console.log(err);
                });
            } else if(oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()){
                if(unverifiedInfo){
                    if(client.config.debugger) console.log(`[SYSTEM] Timeout removed while member with id ${newMember.id} hasn't verified themselves in server with id ${newMember.guild.id}. Adding new timeout.`);
                    let change = null;
                    try{
                        const log = await newMember.guild.fetchAuditLogs({
                            type: AuditLogEvent.MemberUpdate,
                            limit: 1
                        });
                        change = log.entries.first();
                    } catch {
                        const endTimestamp = new Date().getTime() + 1000*60*60*24*7;
                        newMember.disableCommunicationUntil(endTimestamp, `Unverified`).catch(err => {});
                        return;
                    }
                    if((new Date().getTime() - 4e3) > change.createdTimestamp || change.target.id !== newMember.user.id){
                        const endTimestamp = new Date().getTime() + 1000*60*60*24*7;
                        newMember.disableCommunicationUntil(endTimestamp, `Unverified`).catch(err => {});
                        return;
                    }
                    await wait(400);
                }
                if(client.config.debugger) console.log(`[SYSTEM] Timeout removed for member with id ${newMember.id} in server with id ${newMember.guild.id}`);
                let verifiedInfo = client.verified.get(newMember.id) || [];
                let verifiedIndex = verifiedInfo.indexOf(newMember.guild.id);
                if(verifiedIndex >= 0){
                    verifiedInfo.splice(verifiedIndex, 1);
                    return client.verified.set(newMember.id, verifiedInfo);
                }
                newMember.guild.fetchAuditLogs({
                    type: AuditLogEvent.MemberUpdate,
                    limit: 1
                }).then(log => {
                    const change = log.entries.first();

                    if(!change) return;

                    if(change.target.id === newMember.id){
                        client.clientParser.event.emit('muteRemove', oldMember, newMember, change);

                        const logEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, change.target, change.target, {name: 'None', id: 'None'}, messages.logs.unmute.title))
                        .setDescription(handleMessage(client, change.target, change.executor, {name: 'None', id: 'None'}, messages.logs.unmute.message, [{MUTES: userInfo.mutes, REASON: typeof change.reason === 'string' ? change.reason : `No reason added`, MUTE_END: new Date(oldMember.communicationDisabledUntilTimestamp).toString(), UNMUTE_CREATE: new Date(change.createdTimestamp).toString()}]))
                        .setTimestamp();

                        setTimeout(function(){
                            if(client.logs['member'][newMember.guild.id] instanceof TextChannel) client.logs['member'][newMember.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                        }, 1000);

                    }

                }).catch(err => {
                    if(client.config.debugger) console.log(err);
                });
            } else {
                if(!oldMember.guild || !newMember.guild) return;
                if(!newMember.guild.available) return;
                client.clientParser.event.emit('guildMemberUpdate', oldMember, newMember);
            }
        }
    }
}
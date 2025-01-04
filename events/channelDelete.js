const { EmbedBuilder, TextChannel, AuditLogEvent, ChannelType } = require('discord.js');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const { getChannelType } = require("./functions.js");

return module.exports = {
    data: {
        name: 'channelDelete',
        type: 'on'
    },
    callback: function(client){
        return async function(channel){
            if(!client.ready) return;
            if(channel.type === ChannelType.DM) return;
            if(Object.keys(client.mainguilds).indexOf(channel.guild.id) < 0) return;
            if(client.dbTransfer) return;
            
            if(client.config.debugger) console.log(`[SYSTEM] Channel with id ${channel.id} deleted in server with id ${channel.guild.id}`);

            var fromTicket = client.tickets.filter(t => {
                if(typeof t.value === 'string'){
                    return t.value === channel.id;
                } else if(Array.isArray(t.value)){
                    return t.value.filter(t => typeof t === 'string' ? t === channel.id : t.channel === channel.id).length > 0;
                } else {
                    return false;
                }
            });
            if(fromTicket.size > 0){
                const userTickets = client.deepCopy(client.tickets.get(fromTicket.firstKey()));
                const ticketFilter = Array.isArray(userTickets) ? userTickets.filter(t => {
                    if(typeof t === 'string'){
                        return t === channel.id;
                    } else if(typeof t === 'object'){
                        return t.channel === channel.id;
                    } else {
                        return false;
                    }
                }) : [userTickets];
                const ticketIndex = userTickets.indexOf(ticketFilter[0]);
                if(ticketIndex >= 0){
                    try{
                        await client.dbHandler.deleteValue('tickets', userTickets[ticketIndex], {guildId: channel.guild.id, channelId: channel.id, memberId: fromTicket.firstKey()});
                    } catch {}
                }
            } else if(client.logs['channel'][channel.guild.id] instanceof TextChannel) {
                channel.guild.fetchAuditLogs({
                    type: AuditLogEvent.ChannelDelete,
                    limit: 1
                }).then(log => {
                    const chInfo = log.entries.first();
        
                    if(!chInfo) return;
        
                    if(chInfo.target.id === channel.id){
        
                        const logEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, chInfo.executor, undefined, channel, messages.logs['channel-delete'].title))
                        .setDescription(handleMessage(client, chInfo.executor, undefined, channel, messages.logs['channel-delete'].message, [{CHANNEL_TYPE: getChannelType(channel.type), CREATED_CHANNEL: new Date(channel.createdTimestamp).toString()}]))
                        .setTimestamp();
                        
                        setTimeout(function(){
                            client.logs['channel'][channel.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                			client.clientParser.event.emit('channelDelete', channel);
                        }, 1000);
        
                    }
                }).catch(err => {
                    if(client.config.debugger) console.log(err);
                });
            } else {
                client.clientParser.event.emit('channelDelete', channel);
            }
        }
    }
}
const { EmbedBuilder, TextChannel, AuditLogEvent, ChannelType } = require('discord.js');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const { getChannelType, wait } = require("./functions.js");

return module.exports = {
    data: {
        name: 'channelCreate',
        type: 'on'
    },
    callback: function(client){
        return async function(channel){
            if(!client.ready) return;
            if(channel.type === ChannelType.DM) return;
            if(Object.keys(client.mainguilds).indexOf(channel.guild.id) < 0) return;
            if(client.dbTransfer) return;
            
            if(client.config.debugger) console.log(`[SYSTEM] Channel with id ${channel.id} created in server with id ${channel.guild.id}`);

            await wait(2000);
            const getTicket = client.tickets.filter(t => {
                if(typeof t.value === 'string'){
                    return t.value === channel.id;
                } else if(Array.isArray(t.value)){
                    return t.value.filter(t => typeof t === 'string' ? t === channel.id : t.channel === channel.id && t.guild === channel.guild.id).length > 0;
                } else {
                    return false;
                }
            });
            if(getTicket.size > 0){
                client.clientParser.event.emit('channelCreate', channel);
                return;
            }
            if(client.logs['channel'][channel.guild.id] instanceof TextChannel){
                channel.guild.fetchAuditLogs({
                    type: AuditLogEvent.ChannelCreate,
                    limit: 1
                }).then(log => {
                    const chInfo = log.entries.first();
        
                    if(!chInfo) return;
        
                    if(chInfo.target.id === channel.id){
        
                        const logEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, chInfo.executor, undefined, channel, messages.logs['channel-create'].title))
                        .setDescription(handleMessage(client, chInfo.executor, undefined, channel, messages.logs['channel-create'].message, [{CHANNEL_TYPE: getChannelType(channel.type), CREATED_CHANNEL: new Date(channel.createdTimestamp).toString()}]))
                        .setTimestamp();
        
                        setTimeout(function(){
                            client.logs['channel'][channel.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                			client.clientParser.event.emit('channelCreate', channel);
                        }, 1000);
        
                    }
                }).catch(err => {
                    if(client.config.debugger) console.log(err);
                    client.clientParser.event.emit('channelCreate', channel);
                });
            } else {
                client.clientParser.event.emit('channelCreate', channel);
            }
        }
    }
}
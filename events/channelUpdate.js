const { AuditLogEvent, EmbedBuilder, TextChannel } = require("discord.js");
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');

return module.exports = {
    data: {
        name: 'channelUpdate',
        type: 'on'
    },
    callback: function(client){
        return async function(oldChannel, newChannel){
            if(!client.ready) return;
            if(Object.keys(client.mainguilds).indexOf(newChannel.guild.id) < 0) return;
            if(client.dbTransfer) return;
            
            if(client.config.debugger) console.log(`[SYSTEM] Channel with id ${newChannel.id} updated in server with id ${newChannel.guild.id}`);

            newChannel.guild.fetchAuditLogs({
                type: AuditLogEvent.ChannelUpdate,
                limit: 1
            }).then(logs => {
                const log = logs.entries.first();

                if(!log) return;

                if(log.target.id !== newChannel.id) return;

                let oldTopicName = oldChannel.topic;
                if(oldTopicName){
                    if(oldTopicName.length > 40) oldTopicName = oldTopicName.slice(0, 40)+'...';
                } else oldTopicName = handleMessage(client, log.executor, undefined, newChannel, messages.logs.channelUpdate.text["no-topic"]);

                let newTopicName = newChannel.topic;
                if(newTopicName){
                    if(newTopicName.length > 40) newTopicName = newTopicName.slice(0, 40)+'...';
                } else newTopicName = handleMessage(client, log.executor, undefined, newChannel, messages.logs.channelUpdate.text["no-topic"]);

                let disabledNSFW = handleMessage(client, log.executor, undefined, newChannel, messages.logs.channelUpdate.text["nsfw-disabled"]);
                let enabledNSFW = handleMessage(client, log.executor, undefined, newChannel, messages.logs.channelUpdate.text["nsfw-enabled"]);

                const logEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, log.executor, undefined, newChannel, messages.logs.channelUpdate.title, [{OLD_CHANNEL_NAME: oldChannel.name, NEW_CHANNEL_NAME: newChannel.name, OLD_TOPIC: oldTopicName, NEW_TOPIC: newTopicName, OLD_POSITION: oldChannel.position, NEW_POSITION: newChannel.position, OLD_PERMISSIONS: oldChannel.permissionOverwrites.cache.size, NEW_PERMISSIONS: newChannel.permissionOverwrites.cache.size, OLD_NSFW: oldChannel.nsfw ? enabledNSFW : disabledNSFW, NEW_NSFW: newChannel.nsfw ? enabledNSFW : disabledNSFW}]))
                .setDescription(handleMessage(client, log.executor, undefined, newChannel, messages.logs.channelUpdate.message, [{OLD_CHANNEL_NAME: oldChannel.name, NEW_CHANNEL_NAME: newChannel.name, OLD_TOPIC: oldTopicName, NEW_TOPIC: newTopicName, OLD_POSITION: oldChannel.position, NEW_POSITION: newChannel.position, OLD_PERMISSIONS: oldChannel.permissionOverwrites.cache.size, NEW_PERMISSIONS: newChannel.permissionOverwrites.cache.size, OLD_NSFW: oldChannel.nsfw ? enabledNSFW : disabledNSFW, NEW_NSFW: newChannel.nsfw ? enabledNSFW : disabledNSFW}]))
                .setFields(messages.logs.channelUpdate.fields.reduce((arr, item) => {
                    arr.push({
                        name: handleMessage(client, log.executor, undefined, newChannel, item.name, [{OLD_CHANNEL_NAME: oldChannel.name, NEW_CHANNEL_NAME: newChannel.name, OLD_TOPIC: oldTopicName, NEW_TOPIC: newTopicName, OLD_POSITION: oldChannel.position, NEW_POSITION: newChannel.position, OLD_PERMISSIONS: oldChannel.permissionOverwrites.cache.size, NEW_PERMISSIONS: newChannel.permissionOverwrites.cache.size, OLD_NSFW: oldChannel.nsfw ? enabledNSFW : disabledNSFW, NEW_NSFW: newChannel.nsfw ? enabledNSFW : disabledNSFW}]),
                        value: handleMessage(client, log.executor, undefined, newChannel, item.value, [{OLD_CHANNEL_NAME: oldChannel.name, NEW_CHANNEL_NAME: newChannel.name, OLD_TOPIC: oldTopicName, NEW_TOPIC: newTopicName, OLD_POSITION: oldChannel.position, NEW_POSITION: newChannel.position, OLD_PERMISSIONS: oldChannel.permissionOverwrites.cache.size, NEW_PERMISSIONS: newChannel.permissionOverwrites.cache.size, OLD_NSFW: oldChannel.nsfw ? enabledNSFW : disabledNSFW, NEW_NSFW: newChannel.nsfw ? enabledNSFW : disabledNSFW}]),
                        inline: item.inline
                    })
                    return arr;
                }, []))
                .setTimestamp();

                client.clientParser.event.emit('channelUpdate', oldChannel, newChannel, log);

                setTimeout(function(){
                    if(client.logs['channel'][newChannel.guild.id] instanceof TextChannel) client.logs['channel'][newChannel.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                }, 1000);
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            });
        }
    }
}
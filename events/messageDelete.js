const { EmbedBuilder, TextChannel, AuditLogEvent } = require('discord.js');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const { wait } = require('./functions.js');

return module.exports = {
    data: {
        name: 'messageDelete',
        type: 'on'
    },
    callback: function(client){
        return async function(message){
            if(!client.ready) return;
            if(!message.inGuild()) return;
            if(Object.keys(client.mainguilds).indexOf(message.guild.id) < 0) return;
            if(client.dbTransfer) return;
            if(!message.member) return;
            await wait(1000);

            if(client.config.debugger) console.log(`[SYSTEM] Message deleted from user with id ${message.member.id} in server with id ${message.guild.id}`);

            message.guild.fetchAuditLogs({
                type: AuditLogEvent.MessageDelete,
                limit: 1
            }).then(log => {
                let msgInfo = log.entries.first() || {target: {id: '0'}, executor: {id: '0'}, extra: {channel: {id: '0'}}, createdTimestamp: 0};
                var messageContent = (message.content || '').split("`").join("").split("\n").join("");
                messageContent = messageContent.length > 400 ? messageContent.slice(0, 400)+`...` : messageContent;
                messageContent = messageContent.length === 0 ? `No content` : messageContent;

                let xp = client.deepCopy(client.xp.get(message.member.id) || [{level: 0, messages: 0, guild: message.guild.id, xp: 0}]);
                let userXP = xp.filter(x => x.guild === message.guild.id)[0] || {level: 0, messages: 0, xp: 0, guild: message.guild.id};

                const logEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, message.member.user, msgInfo.executor, message.channel, messages.logs['message-delete'].title))
                .setTimestamp();

                if(msgInfo.target.id === message.member.id && msgInfo.extra.channel.id === message.channel.id && msgInfo.createdTimestamp >= (new Date().getTime() - 3000)){
                    client.clientParser.event.emit('messageDelete', message, msgInfo.executor);
                    logEmbed.setDescription(handleMessage(client, message.member.user, msgInfo.executor, message.channel, messages.logs['message-delete'].message, [{MESSAGES: userXP.messages, MESSAGE_ID: message.id, MESSAGE_CONTENT: messageContent, EMBEDS_AMOUNT: message.embeds.length, ATTACHMENTS_AMOUNT: message.attachments.size}]));
                } else {
                    if(message.member.user.id === client.user.id) return;
                    client.clientParser.event.emit('messageDelete', message, message.member.user);
                    logEmbed.setDescription(handleMessage(client, message.member.user, message.member.user, message.channel, messages.logs['message-delete'].message, [{MESSAGES: userXP.messages, MESSAGE_ID: message.id, MESSAGE_CONTENT: messageContent, EMBEDS_AMOUNT: message.embeds.length, ATTACHMENTS_AMOUNT: message.attachments.size}]));
                }

                setTimeout(function(){
                    if(client.logs['message'][message.guild.id] instanceof TextChannel) client.logs['message'][message.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                }, 1000);
            }).catch(err => {
                if(client.config.debugging) console.log(err);
            });
            if(message.channel.id === client.config.countingChannel[message.guild.id]){
                if(client.interactionActions.get('ignore-delete-count-'+message.guild.id) === message.member.user.id){
                    await wait(1e3);
                    if(client.interactionActions.get('ignore-delete-count-'+message.guild.id) === message.member.user.id) client.interactionActions.delete('ignore-delete-count-'+message.guild.id);
                    return;
                }
                let lastNumber = client.deepCopy((client.globals.get(`counting`) || {}));
                if(!lastNumber[message.guild.id]) lastNumber[message.guild.id] = {lastPerson: 0, number: 0};
                message.channel.send({content: handleMessage(client, message.member.user, undefined, message.channel, messages.countingDelete, [{NUMBER: (lastNumber[message.guild.id].number + 1).toString()}])}).catch(err => {});
            } else if(message.channel.id === client.config.snakeChannel[message.guild.id]){
                if(client.interactionActions.get('ignore-delete-snake-'+message.guild.id) === message.member.user.id){
                    await wait(1e3);
                    if(client.interactionActions.get('ignore-delete-snake-'+message.guild.id) === message.member.user.id) client.interactionActions.delete('ignore-delete-snake-'+message.guild.id);
                    return;
                }
                let lastWord = client.deepCopy((client.globals.get(`snake`) || {}));
                if(!lastWord[message.guild.id]) lastWord[message.guild.id] = {word: undefined, lastPerson: 0, lastLatter: 'Unknown'};
                message.channel.send({content: handleMessage(client, message.member.user, undefined, message.channel, messages.snakeDelete, [{LETTER: lastWord[message.guild.id].lastLetter}])}).catch(err => {});
            }
        }
    }
}
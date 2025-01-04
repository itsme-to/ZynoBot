const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');
const { wait, validateURL } = require('./functions.js');
const { EmbedBuilder, TextChannel } = require('discord.js');

return module.exports = {
    data: {
        name: 'messageUpdate',
        type: 'on'
    },
    callback: function(client){
        return async function(oldMessage, newMessage){
            if(!client.ready) return;
            if(!oldMessage || !newMessage) return;
            if(!newMessage.inGuild()) return;
            if(!newMessage.author) return;
            if(Object.keys(client.mainguilds).indexOf(newMessage.guild.id) < 0) return;
            if(client.dbTransfer) return;
            if(newMessage.author.id === client.user.id){
                if(!newMessage.member) return;
                client.clientParser.event.emit('messageUpdate', oldMessage, newMessage);
                return;
            }

            if(newMessage.partial){
                try{
                    await newMessage.fetch();
                    await wait(4e2);
                } catch {
                    return;
                }
            }
            
            if(!newMessage.member) return;

            if(client.config.debugger) console.log(`[SYSTEM] Message updated from user with id ${newMessage.member.id} in server with id ${newMessage.guild.id}`);

            if(oldMessage.channel.id === client.config.countingChannel[newMessage.guild.id]){
                client.interactionActions.set('ignore-delete-count-'+newMessage.guild.id, newMessage.member.user.id);
                newMessage.delete().catch(err => {});
                await wait(200);
                let lastNumber = client.deepCopy((client.globals.get(`counting`) || {}));
                if(!lastNumber[oldMessage.guild.id]) lastNumber[oldMessage.guild.id] = {lastPerson: 0, number: 0};
                client.clientParser.event.emit('messageUpdate', oldMessage, newMessage);
                return oldMessage.channel.send({content: handleMessage(client, newMessage.member.user, undefined, newMessage.channel, messages.countingEdit, [{NUMBER: (lastNumber[oldMessage.guild.id].number + 1).toString()}])}).catch(err => {});
            } else if(oldMessage.channel.id === client.config.snakeChannel[newMessage.guild.id]){
                client.interactionActions.set('ignore-delete-snake-'+newMessage.guild.id, newMessage.member.user.id);
                newMessage.delete().catch(err => {});
                await wait(200);
                let lastWord = client.deepCopy((client.globals.get(`snake`) || {}));
                if(!lastWord[oldMessage.guild.id]) lastWord[oldMessage.guild.id] = {word: undefined, lastPerson: 0, lastLatter: 'Unknown'};
                client.clientParser.event.emit('messageUpdate', oldMessage, newMessage);
                return oldMessage.channel.send({content: handleMessage(client, newMessage.member.user, undefined, newMessage.channel, messages.snakeEdit, [{LETTER: lastWord[oldMessage.guild.id].lastLetter}])}).catch(err => {});
            }

            const antiFilterChannels = client.deepCopy((client.globals.get(`anti-filter`) || [])).filter(c => c.guild === newMessage.guild.id).map(c => c.channel);
            const antiFilterRoles = client.deepCopy((client.globals.get(`anti-filter-roles`) || {}))[newMessage.guild.id] || [];

            if((client.config.filters.badword[newMessage.guild.id] === true || client.config.filters.invite[newMessage.guild.id] === true || client.config.filters.links[newMessage.guild.id] === true) && antiFilterChannels.indexOf(newMessage.channel.id) < 0 && newMessage.member.roles.cache.filter(r => antiFilterRoles.indexOf(r.id) >= 0).size === 0){
                let content = (newMessage.content || '').toLowerCase().split(" ");
                const urls = content.filter(word => validateURL(word));
                if(urls.length > 0 && (client.config.filters.invite[newMessage.guild.id] === true || client.config.filters.links[newMessage.guild.id] === true)){
                    if(client.config.filters.links[newMessage.guild.id] === true){
                        newMessage.channel.send(handleMessage(client, newMessage.member.user, undefined, newMessage.channel, messages.filters.url)).catch(err => {});
                        client.clientParser.event.emit('messageUpdate', oldMessage, newMessage);
                        await wait(200);
                        return newMessage.delete().catch(err => {});
                    } else if(client.config.filters.invite[newMessage.guild.id] === true){
                        const validURL = urls.map(u => validateURL(u));
                        const invites = validURL.filter(u => u.hostname.toLowerCase() === 'discord.gg' || ((u.hostname.toLowerCase() === 'discord.com' || u.hostname.toLowerCase() === 'discordapp.com') && u.pathname.toLowerCase().startsWith('/invite')));
                        if(invites.length > 0){
                            newMessage.channel.send(handleMessage(client, newMessage.member.user, undefined, newMessage.channel, messages.filters.invite)).catch(err => {});
                            client.clientParser.event.emit('messageUpdate', oldMessage, newMessage);
                            await wait(200);
                            return newMessage.delete().catch(err => {});
                        }
                    }
                }
                if(client.config.filters.invite[newMessage.guild.id] === true){
                    const invites = content.filter(u => u.includes('discord.gg') || u.includes('discord.com/invite') || u.includes('discordapp.com/invite') || u.includes('/invite/'));
                    if(invites.length > 0){
                        newMessage.channel.send(handleMessage(client, newMessage.member.user, undefined, newMessage.channel, messages.filters.invite)).catch(err => {});
                        client.clientParser.event.emit('messageUpdate', oldMessage, newMessage);
                        await wait(200);
                        return newMessage.delete().catch(err => {});
                    }
                }
                if(client.config.filters.badword[newMessage.guild.id] === true){
                    const badWords = client.deepCopy(client.badwords.get(newMessage.guild.id) || []);
                    const words = content.filter(w => badWords.includes(w.toLowerCase()));
                    if(words.length > 0){
                        newMessage.channel.send(handleMessage(client, newMessage.member.user, undefined, newMessage.channel, messages.filters.badword)).catch(err => {});
                        client.clientParser.event.emit('messageUpdate', oldMessage, newMessage);
                        await wait(200);
                        return newMessage.delete().catch(err => {});
                    }
                }
            }

            let xp = client.deepCopy(client.xp.get(newMessage.member.id) || [{level: 0, messages: 0, guild: newMessage.guild.id, xp: 0}]);
            let userXP = xp.filter(x => x.guild === newMessage.guild.id)[0] || {level: 0, messages: 0, xp: 0, guild: newMessage.guild.id};

            var messageContentOld = (oldMessage.content || '').split("`").join("").split("\n").join("");
            messageContentOld = messageContentOld.length > 400 ? messageContentOld.slice(0, 400)+`...` : messageContentOld;
            messageContentOld = messageContentOld.length === 0 ? `No content` : messageContentOld;

            var messageContentNew = (newMessage.content || '').split("`").join("").split("\n").join("");
            messageContentNew = messageContentNew.length > 400 ? messageContentNew.slice(0, 400)+`...` : messageContentNew;
            messageContentNew = messageContentNew.length === 0 ? `No content` : messageContentNew;

            const logEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true, size: 256})})
            .setTitle(handleMessage(client, newMessage.member.user, undefined, newMessage.channel, messages.logs['message-update'].title))
            .setDescription(handleMessage(client, newMessage.member.user, undefined, newMessage.channel, messages.logs['message-update'].message, [{MESSAGES: userXP.messages, MESSAGE_ID: newMessage.id, MESSAGE_URL: newMessage.url, OLD_CONTENT: messageContentOld, NEW_CONTENT: messageContentNew, OLD_EMBEDS_AMOUNT: oldMessage.embeds.length, NEW_EMBEDS_AMOUNT: newMessage.embeds.length, OLD_ATTACHMENTS_AMOUNT: oldMessage.attachments.size, NEW_ATTACHMENTS_AMOUNT: newMessage.attachments.size}]))
            .setFields(
                messages.logs['message-update'].fields.reduce((arr, item) => {
                    arr.push({
                        name: handleMessage(client, newMessage.member.user, undefined, newMessage.channel, item.name, [{MESSAGES: userXP.messages, MESSAGE_ID: newMessage.id, MESSAGE_URL: newMessage.url, OLD_CONTENT: messageContentOld, NEW_CONTENT: messageContentNew, OLD_EMBEDS_AMOUNT: oldMessage.embeds.length, NEW_EMBEDS_AMOUNT: newMessage.embeds.length, OLD_ATTACHMENTS_AMOUNT: oldMessage.attachments.size, NEW_ATTACHMENTS_AMOUNT: newMessage.attachments.size}]),
                        value: handleMessage(client, newMessage.member.user, undefined, newMessage.channel, item.value, [{MESSAGES: userXP.messages, MESSAGE_ID: newMessage.id, MESSAGE_URL: newMessage.url, OLD_CONTENT: messageContentOld, NEW_CONTENT: messageContentNew, OLD_EMBEDS_AMOUNT: oldMessage.embeds.length, NEW_EMBEDS_AMOUNT: newMessage.embeds.length, OLD_ATTACHMENTS_AMOUNT: oldMessage.attachments.size, NEW_ATTACHMENTS_AMOUNT: newMessage.attachments.size}]),
                        inline: item.inline
                    })
                    return arr;
                }, [])
            )
            .setTimestamp();

            let change = newMessage.content !== oldMessage.content || newMessage.attachments.size !== oldMessage.attachments.size || newMessage.embeds.length !== oldMessage.embeds.length;

            setTimeout(function(){
                if(client.logs['message'][newMessage.guild.id] instanceof TextChannel && change) client.logs['message'][newMessage.guild.id].send({embeds: [logEmbed]}).catch(err => {});
            }, 1000);
            client.clientParser.event.emit('messageUpdate', oldMessage, newMessage);
        }
    }
}
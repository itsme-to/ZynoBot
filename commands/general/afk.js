const { EmbedBuilder } = require('discord.js');
const handleMessage = require('../../handlers/handleMessages.js');
const messages = require('../../messages.json');
const { wait } = require("../../functions");

module.exports = {
    data: {
        name: 'afk',
        description: 'Set yourself afk',
        options: [{type: 3, name: 'reason', description: 'The reason why you go afk', required: false}],
        category: 'General',
        visible: true,
        defaultEnabled: false
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        let getAfkReasons = client.deepCopy(client.afk.get(message.member.user.id) || [{guild: '0'}]);
        if(getAfkReasons.filter(a => a.guild === message.guild.id).length > 0){
            if(message.member.displayName.startsWith('[AFK] ')){
                const newNickname = message.member.displayName.split('[AFK] ').slice(1).join('[AFK] ');
                message.member.setNickname(newNickname).catch(err => {});
            }
            getAfkReasons = client.deepCopy((client.afk.get(message.member.user.id) || [{guild: message.guild.id, reason: 'No reason added'}]));
            const guildAfk = getAfkReasons.filter(a => a.guild === message.guild.id);
            if(guildAfk.length > 0){
                try{
                    await client.dbHandler.deleteValue(`afk`, guildAfk[0], {memberId: message.member.id});
                } catch {}
            }
            await wait(400);
            
            const removedAFK = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.afk['removed-afk'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.afk['removed-afk'].message))
            .setTimestamp();

            sendMessage({embeds: [removedAFK]}).catch(err => {});
        } else {
            const reason = args.length > 1 ? args.slice(1).join(" ") : 'No reason added';

            const reasonTooLong = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.afk['reason-too-long'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.afk['reason-too-long'].message, [{REASON: reason}]))
            .setTimestamp();

            if(reason.length > 400) return sendMessage({embeds: [reasonTooLong]}).catch(err => {});

            message.member.setNickname('[AFK] '+message.member.displayName).catch(err => {});
            getAfkReasons = client.deepCopy(client.afk.get(message.member.user.id) || []);
            const guildAfk = getAfkReasons.filter(a => a.guild === message.guild.id);
            if(guildAfk.length > 0){
                try{
                    await client.dbHandler.deleteValue(`afk`, guildAfk[0], {memberId: message.member.id});
                } catch {}
            }

            try{
                await client.dbHandler.setValue(`afk`, {guild: message.guild.id, reason: reason}, {memberId: message.member.id});
            } catch {}

            await wait(400);
            
            const setAfk = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.afk['set-afk'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.afk['set-afk'].message, [{REASON: reason}]))
            .setTimestamp();

            sendMessage({embeds: [setAfk]}).catch(err => {});
        }
    }
}
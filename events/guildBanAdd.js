const { EmbedBuilder, TextChannel, AuditLogEvent } = require('discord.js');
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');

return module.exports = {
    data: {
        name: 'guildBanAdd',
        type: 'on'
    },
    callback: function(client){
        return function(userban){
            if(!client.ready) return;
            if(Object.keys(client.mainguilds).indexOf(userban.guild.id) < 0) return;
            if(client.dbTransfer) return;
            
            if(client.config.debugger) console.log(`[SYSTEM] Ban detected for member with id ${userban.user.id} in server with id ${userban.guild.id}`);

            client.banned.set(userban.user.id, new Date().getTime());

            userban.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberBanAdd,
                limit: 1
            }).then(async log => {
                const ban = log.entries.first();

                if(!ban) return;

                if(ban.target.id === userban.user.id){
                    const getUserInfo = client.userinfo.get(userban.user.id);
                    const userInfo = client.deepCopy(getUserInfo || [{joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: userban.guild.id}]).filter(u => u.guild === userban.guild.id)[0] || {joins: 0, kicks: 0, bans: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: member.guild.id};
                    ++userInfo.bans;
                    try{
                        await client.dbHandler.setValue(`userinfo`, userInfo, {memberId: userban.user.id, guildId: userban.guild.id});
                    } catch {}

                    const logEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                    .setTitle(handleMessage(client, ban.target, ban.executor, {name: 'None', id: 'None'}, messages.logs.ban.title))
                    .setDescription(handleMessage(client, ban.target, ban.executor, {name: 'None', id: 'None'}, messages.logs.ban.message, [{REASON: typeof ban.reason === `string` ? ban.reason : `No reason provided`, BANNED_AT: new Date(ban.createdTimestamp).toString(), BANS: userInfo.bans}]))
                    .setTimestamp();
                	client.clientParser.event.emit('ban', userban, ban);

                    if(client.logs['member'][userban.guild.id] instanceof TextChannel){
                        setTimeout(function(){
                            client.logs['member'][userban.guild.id].send({embeds: [logEmbed]}).catch(console.log);
                        }, 300);
                    }
                }
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            });
        }
    }
}
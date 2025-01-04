const { AuditLogEvent, EmbedBuilder, TextChannel } = require("discord.js");
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');

return module.exports = {
    data: {
        name: 'roleDelete',
        type: 'on'
    },
    callback: function(client){
        return async function(role){
            if(!client.ready) return;
            if(Object.keys(client.mainguilds).indexOf(role.guild.id) < 0) return;
            if(client.dbTransfer) return;

            if(client.config.debugger) console.log(`[SYSTEM] Role deleted with id ${role.id} in server with id ${role.guild.id}`);

            role.guild.fetchAuditLogs({
                type: AuditLogEvent.RoleDelete,
                limit: 1
            }).then(logs => {
                const log = logs.entries.first();

                if(!log) return;

                if(log.target.id !== role.id) return;

                let hex = `#${role.color.toString(16)}`;
                while(hex.length < 7){
                    hex += '0';
                }

                const logEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, log.executor, undefined, {name: 'None', id: 'None'}, messages.logs.roleDelete.title, [{ROLE_NAME: role.name, ROLE_COLOR: hex, ROLE_BITFIELD: role.permissions.bitfield.toString(), ROLE_ICON: role.icon ? `[${role.icon}](${role.icon})` : `None`}]))
                .setDescription(handleMessage(client, log.executor, undefined, {name: 'None', id: 'None'}, messages.logs.roleDelete.message, [{ROLE_NAME: role.name, ROLE_COLOR: hex, ROLE_BITFIELD: role.permissions.bitfield.toString(), ROLE_ICON: role.icon ? `[${role.icon}](${role.icon})` : `None`}]))
                .setTimestamp();

                client.clientParser.event.emit('roleDelete', role, log);

                setTimeout(function(){
                    if(client.logs['role'][role.guild.id] instanceof TextChannel) client.logs['role'][role.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                }, 1000);
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            });
        }
    }
}
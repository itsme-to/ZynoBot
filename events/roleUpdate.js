const { AuditLogEvent, EmbedBuilder, TextChannel } = require("discord.js");
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');

return module.exports = {
    data: {
        name: 'roleUpdate',
        type: 'on'
    },
    callback: function(client){
        return async function(oldRole, newRole){
            if(!client.ready) return;
            if(Object.keys(client.mainguilds).indexOf(newRole.guild.id) < 0) return;
            if(client.dbTransfer) return;

            if(client.config.debugger) console.log(`[SYSTEM] Role updated with id ${newRole.id} in server with id ${newRole.guild.id}`);

            newRole.guild.fetchAuditLogs({
                type: AuditLogEvent.RoleUpdate,
                limit: 1
            }).then(logs => {
                const log = logs.entries.first();

                if(!log) return;

                if(log.target.id !== newRole.id) return;

                let oldHex = `#${oldRole.color.toString(16)}`;
                while(oldHex.length < 7){
                    oldHex += '0';
                }

                let newHex = `#${newRole.color.toString(16)}`;
                while(newHex.length < 7){
                    newHex += '0';
                }

                const logEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, log.executor, undefined, {name: 'None', id: 'None'}, messages.logs.roleUpdate.title, [{OLD_ROLE_NAME: oldRole.name, NEW_ROLE_NAME: newRole.name, OLD_ROLE_COLOR: oldHex, NEW_ROLE_COLOR: newHex, ROLE_MENTION: `<@&${newRole.id}>`, OLD_ROLE_BITFIELD: oldRole.permissions.bitfield.toString(), NEW_ROLE_BITFIELD: newRole.permissions.bitfield.toString(), OLD_ROLE_ICON: oldRole.icon ? `[${oldRole.icon}](${oldRole.icon})` : `None`, NEW_ROLE_ICON: newRole.icon ? `[${newRole.icon}](${newRole.icon})` : `None`}]))
                .setDescription(handleMessage(client, log.executor, undefined, {name: 'None', id: 'None'}, messages.logs.roleUpdate.message, [{OLD_ROLE_NAME: oldRole.name, NEW_ROLE_NAME: newRole.name, OLD_ROLE_COLOR: oldHex, NEW_ROLE_COLOR: newHex, ROLE_MENTION: `<@&${newRole.id}>`, OLD_ROLE_BITFIELD: oldRole.permissions.bitfield.toString(), NEW_ROLE_BITFIELD: newRole.permissions.bitfield.toString(), OLD_ROLE_ICON: oldRole.icon ? `[${oldRole.icon}](${oldRole.icon})` : `None`, NEW_ROLE_ICON: newRole.icon ? `[${newRole.icon}](${newRole.icon})` : `None`}]))
                .setFields(messages.logs.roleUpdate.fields.reduce((arr, item) => {
                    arr.push({
                        name: handleMessage(client, log.executor, undefined, {name: 'None', id: 'None'}, item.name, [{OLD_ROLE_NAME: oldRole.name, NEW_ROLE_NAME: newRole.name, OLD_ROLE_COLOR: oldHex, NEW_ROLE_COLOR: newHex, ROLE_MENTION: `<@&${newRole.id}>`, OLD_ROLE_BITFIELD: oldRole.permissions.bitfield.toString(), NEW_ROLE_BITFIELD: newRole.permissions.bitfield.toString(), OLD_ROLE_ICON: oldRole.icon ? `[${oldRole.icon}](${oldRole.icon})` : `None`, NEW_ROLE_ICON: newRole.icon ? `[${newRole.icon}](${newRole.icon})` : `None`}]),
                        value: handleMessage(client, log.executor, undefined, {name: 'None', id: 'None'}, item.value, [{OLD_ROLE_NAME: oldRole.name, NEW_ROLE_NAME: newRole.name, OLD_ROLE_COLOR: oldHex, NEW_ROLE_COLOR: newHex, ROLE_MENTION: `<@&${newRole.id}>`, OLD_ROLE_BITFIELD: oldRole.permissions.bitfield.toString(), NEW_ROLE_BITFIELD: newRole.permissions.bitfield.toString(), OLD_ROLE_ICON: oldRole.icon ? `[${oldRole.icon}](${oldRole.icon})` : `None`, NEW_ROLE_ICON: newRole.icon ? `[${newRole.icon}](${newRole.icon})` : `None`}]),
                        inline: item.inline
                    })
                    return arr;
                }, []))
                .setTimestamp();

                client.clientParser.event.emit('roleUpdate', oldRole, newRole, log);

                setTimeout(function(){
                    if(client.logs['role'][newRole.guild.id] instanceof TextChannel) client.logs['role'][newRole.guild.id].send({embeds: [logEmbed]}).catch(err => {});
                }, 1000);
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            });
        }
    }
}
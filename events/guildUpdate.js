return module.exports = {
    data: {
        name: 'guildUpdate',
        type: 'on'
    },
    callback: function(client){
        return async function(oldGuild, newGuild){
            if(Object.keys(client.mainguilds).indexOf(newGuild.id) < 0) return;
            if(client.dbTransfer) return;

            if(client.config.debugger) console.log(`[SYSTEM] Update detected for server with id ${newGuild.id}`);

            client.mainguilds[newGuild.id] = newGuild;
            client.clientParser.event.emit('guildUpdate', oldGuild, newGuild);
        }
    }
}
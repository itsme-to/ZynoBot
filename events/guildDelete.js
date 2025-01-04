const { wait } = require('./functions.js');
const configHandler = require('./handlers/saveConfig.js');

return module.exports = {
    data: {
        name: 'guildDelete',
        type: 'on'
    },
    callback: function(client){
        return async function(guild){
            
            if(client.config.debugger) console.log(`[SYSTEM] Bot removed from server with id ${guild.id}`);

            if(client.config.guilds.indexOf(guild.id) < 0) return;
            if(client.dbTransfer) return;
            const guildIdIndex = client.config.guilds.indexOf(guild.id);
            if(guildIdIndex >= 0) client.config.guilds.splice(guildIdIndex, 1);
            delete client.config.tickets.roles[guild.id];
            delete client.config.tickets.parent[guild.id];
            delete client.config.tickets.dm[guild.id];
            delete client.config.tickets.categoryType[guild.id];
            delete client.config.tickets.max[guild.id];
            delete client.config.tickets['claim-system'][guild.id];
            delete client.config.tickets['instant-category'][guild.id];
            delete client.config.tickets['tag-support'][guild.id];
            delete client.config.tickets['logs-channel'][guild.id];
            delete client.config.tickets['auto-tag'][guild.id];
            delete client.config.joinRoles[guild.id];
            delete client.config.moderator_roles[guild.id];
            delete client.config.minecraft[guild.id];
            delete client.config.fivem[guild.id]
            delete client.config.verificationType[guild.id];
            delete client.config.welcome[guild.id]
            delete client.config.leave[guild.id];
            delete client.config.filters.badword[guild.id];
            delete client.config.filters.invite[guild.id];
            delete client.config.filters.links[guild.id];
            delete client.config.level['notification-channel'][guild.id];
            delete client.config.level['canvas-type'][guild.id];
            delete client.config.level['level-up-messages'][guild.id];
            delete client.config.level.difficulty[guild.id];
            delete client.config.logs['channel'][guild.id];
            delete client.config.logs['member'][guild.id];
            delete client.config.logs['role'][guild.id];
            delete client.config.logs['message'][guild.id];
            delete client.config.countingChannel[guild.id];
            delete client.config.snakeChannel[guild.id];
            delete client.config.suggestion[guild.id];
            delete client.config.autoreply.song[guild.id];
            delete client.config.autoreply.command[guild.id];

            configHandler(client, client.config);

            try{
                await client.dbHandler.forceDeleteGuild(`tickets`, guild.id);
                await wait(4e2);
            } catch {}

            try{
                await client.dbHandler.forceDeleteGuild(`economy`, guild.id);
                await wait(4e2);
            } catch {}
            
            try{
                await client.dbHandler.forceDeleteGuild(`userinfo`, guild.id);
                await wait(4e2);
            } catch {}

            try{
                await client.dbHandler.forceDeleteGuild(`xp`, guild.id);
                await wait(4e2);
            } catch {}
            
            try{
                await client.dbHandler.forceDeleteGuild(`unverified`, guild.id);
                await wait(4e2);
            } catch {}

            const membersCount = client.deepCopy((client.globals.get('membersCount') ?? {}));
            if(membersCount){
                delete membersCount[guild.id];
                try{
                    await client.dbHandler.setValue(`globals`, membersCount, {'globalsKey': `membersCount`});
                } catch {}
            }
            const temporaryActions = client.deepCopy((client.globals.get('temporaryActions') ?? {}));
            if(temporaryActions){
                delete temporaryActions[guild.id];
                try{
                    await client.dbHandler.setValue(`globals`, temporaryActions, {'globalsKey': `temporaryActions`});
                } catch {}
            }
            const verificationRole = client.deepCopy((client.globals.get('verification-role') ?? {}));
            if(verificationRole){
                delete verificationRole[guild.id];
                try{
                    await client.dbHandler.setValue(`globals`, verificationRole, {'globalsKey': `verification-role`});
                } catch {}
            }
            const verificationChannel = client.deepCopy((client.globals.get('verification-channel') ?? {}));
            if(verificationChannel){
                delete verificationChannel[guild.id];
                try{
                    await client.dbHandler.setValue(`globals`, verificationChannel, {'globalsKey': `verification-channel`});
                } catch {}
            }
            const ticketCount = client.deepCopy((client.globals.get('ticket_count') ?? {}));
            if(ticketCount){
                delete ticketCount[guild.id];
                try{
                    await client.dbHandler.setValue(`globals`, ticketCount, {'globalsKey': `ticket_count`});
                } catch {}
            }
            const ticketCategories = client.deepCopy((client.globals.get('ticket-categories') ?? {}));
            if(ticketCategories){
                delete ticketCategories[guild.id];
                try{
                    await client.dbHandler.setValue(`globals`, ticketCategories, {'globalsKey': `ticket-categories`});
                } catch {}
            }
            let antiFilterChannels = client.deepCopy((client.globals.get('anti-filter') ?? []));
            if(antiFilterChannels){
                antiFilterChannels = antiFilterChannels.filter(a => a.guild !== guild.id);
                try{
                    await client.dbHandler.setValue(`globals`, antiFilterChannels, {'globalsKey': `anti-filter`});
                } catch {}
            }
            const counting = client.deepCopy((client.globals.get('counting') ?? {}));
            if(counting){
                delete counting[guild.id];
                try{
                    await client.dbHandler.setValue(`globals`, counting, {'globalsKey': `counting`});
                } catch {}
            }

            try{
                await client.dbHandler.forceDeleteGuild(`reactrole`, guild.id);
                await wait(4e2);
            } catch {}

            try{
                await client.dbHandler.forceDeleteGuild(`suggestions`, guild.id);
                await wait(4e2);
            } catch {}

            try{
                await client.dbHandler.forceDeleteGuild(`polls`, guild.id);
                await wait(4e2);
            } catch {}

            try{
                await client.dbHandler.forceDeleteGuild(`warns`, guild.id);
                await wait(4e2);
            } catch {}

            try{
                await client.dbHandler.forceDeleteGuild(`badwords`, guild.id);
                await wait(4e2);
            } catch {}

            try{
                await client.dbHandler.forceDeleteGuild(`afk`, guild.id);
                await wait(4e2);
            } catch {}

            try{
                await client.dbHandler.forceDeleteGuild(`shop`, guild.id);
                await wait(4e2);
            } catch {}

    		client.clientParser.event.emit('serverDelete', guild);
        }
    }
}
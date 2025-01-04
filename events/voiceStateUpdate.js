const { ChannelType } = require('discord.js');
const { ValueSaver } = require("valuesaver");
const economyHandler = require("./handlers/economy.js");

const timeouts = new ValueSaver();

function timeoutCreator(client, state, coins, timeout){
    return async function(){
        const userEconomy = economyHandler.getUser(client, state.member.id, state);
        const guildEconomy = userEconomy.filter(e => e.guild === state.member.guild.id)[0];
        guildEconomy.cash += coins;

        try{
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: state.member.id, guildId: state.member.guild.id});
        } catch {}
        const userTimeout = setTimeout(function(){
            timeoutCreator(client, state, coins, timeout)();
        }, timeout);
        const currentTimeouts = timeouts.get(state.member.id) || [];
        const currentTimeout = currentTimeouts.filter(t => t.guild === state.member.guild.id)[0];
        if(typeof currentTimeout !== 'undefined'){
            const timeoutIndex = currentTimeouts.indexOf(currentTimeout);
            if(timeoutIndex >= 0) currentTimeouts.splice(timeoutIndex, 1);
            clearTimeout(currentTimeout.timeout);
        }
        currentTimeouts.push({
            guild: state.member.guild.id,
            timeout: userTimeout
        });
        timeouts.set(state.member.id, currentTimeouts);
    };
}

return module.exports = {
    data: {
        name: 'voiceStateUpdate',
        type: 'on'
    },
    callback: function(client){
        return function(oldState, newState){
            if(!client.ready) return;
            if(!newState || !oldState) return;
            if(!newState.guild || !oldState.guild) return;
            if((newState.channel || oldState.channel).type === ChannelType.DM) return;
            if(Object.keys(client.mainguilds).indexOf(newState.guild.id) < 0) return;
            if(client.dbTransfer) return;

            if(client.config.debugger) console.log(`[SYSTEM] Voice state update detected for member with id ${newState.member.id} in server with id ${newState.guild.id}`);
            
            client.clientParser.event.emit('voiceStateUpdate', oldState, newState);
            
            if(client.config.economy.voice.enabled === false || client.config.economy.enabled === false) return;

            if(oldState.channelId === null){
                const currentTimeouts = timeouts.get(newState.member.id) || [];
                const currentTimeout = currentTimeouts.filter(t => t.guild === newState.member.guild.id)[0];
                if(typeof currentTimeout !== 'undefined'){
                    const timeoutIndex = currentTimeouts.indexOf(currentTimeout);
                    if(timeoutIndex >= 0) currentTimeouts.splice(timeoutIndex, 1);
                    clearTimeout(currentTimeout.timeout);
                }
                if(newState.serverDeaf === false && newState.serverMute === false && newState.selfDeaf === false && newState.selfMute === false){
                    var member = newState.member;
                    var timeout = typeof client.config.economy.voice.seconds === 'number' ? client.config.economy.voice.seconds * 1000 : 60000;
                    var coins = typeof client.config.economy.voice.coins === 'number' ? client.config.economy.voice.coins : 5;
                    const userTimeout = setTimeout(function(){
                        timeoutCreator(client, newState, coins, timeout)();
                    }, timeout);
                    currentTimeouts.push({
                        guild: newState.member.guild.id,
                        timeout: userTimeout
                    });
                    timeouts.set(member.id, currentTimeouts);
                }
            } else if(newState.channelId === null){
                const currentTimeouts = timeouts.get(oldState.member.id) || [];
                const currentTimeout = currentTimeouts.filter(t => t.guild === oldState.member.guild.id)[0];
                if(typeof currentTimeout !== 'undefined') clearTimeout(currentTimeout.timeout);
            } else {
                const currentTimeouts = timeouts.get(newState.member.id) || [];
                const currentTimeout = currentTimeouts.filter(t => t.guild === newState.member.guild.id)[0];
                if(typeof currentTimeout !== 'undefined') clearTimeout(currentTimeout.timeout);
                if(newState.serverDeaf === false && newState.serverMute === false && newState.selfDeaf === false && newState.selfMute === false){
                    var member = newState.member;
                    var timeout = typeof client.config.economy.voice.seconds === 'number' ? client.config.economy.voice.seconds * 1000 : 60000;
                    var coins = typeof client.config.economy.voice.coins === 'number' ? client.config.economy.voice.coins : 5;
                    const userTimeout = setTimeout(function(){
                        timeoutCreator(client, newState, coins, timeout)();
                    }, timeout);
                    const currentTimeouts = timeouts.get(newState.member.id) || [];
                    const currentTimeout = currentTimeouts.filter(t => t.guild === newState.member.guild.id)[0];
                    if(typeof currentTimeout !== 'undefined'){
                        const timeoutIndex = currentTimeouts.indexOf(currentTimeout);
                        if(timeoutIndex >= 0) currentTimeouts.splice(timeoutIndex, 1);
                        clearTimeout(currentTimeout.timeout);
                    }
                    currentTimeouts.push({
                        guild: newState.member.guild.id,
                        timeout: userTimeout
                    });
                    timeouts.set(member.id, currentTimeouts);
                } else {  
                    const currentTimeouts = timeouts.get(newState.member.id) || [];
                    const currentTimeout = currentTimeouts.filter(t => t.guild === newState.member.guild.id)[0];
                    if(typeof currentTimeout !== 'undefined') clearTimeout(currentTimeout.timeout);
                }
            }
        }
    }
}
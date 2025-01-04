const { EmbedBuilder, Collection } = require('discord.js');
const messages = require('../messages.json');
const handleMessage = require('./handleMessages.js');
const { wait } = require("../functions.js");

var giveaways = [];
var timeout1 = null;
var timeout2 = null;
var hour = 60 * 60 * 1000;

let client;

async function checkEnded(){
    started2 = true;
    clearTimeout(timeout2);
    var endedGiveaways = client.giveawaysEnded.toReadableArray().map(v => v.value);
    var nextEnd = undefined;
    const now = new Date().getTime();
    for(var i = 0; i < endedGiveaways.length; i++){
        var giveaway = endedGiveaways[i];
        if(now > (giveaway.endTimestamp + 7*24*60*60*1000)){
            try{
                await client.dbHandler.deleteValue(`giveawaysEnded`, {}, {messageId: giveaway.messageId});
            } catch(err) {
                console.log(err);
            }
        } else {
            nextEnd = giveaway.endTimestamp - now;
        }
    }
    if(typeof nextEnd === 'undefined'){
        nextEnd = hour;
    } else if(nextEnd > hour){
        nextEnd = hour;
    } else {
        nextEnd += 10000;
    }
    timeout2 = setTimeout(function(){
        checkEnded();
    }, nextEnd);
}

function endGiveaway(client, _info, reroll = false, rerollAmount){
    return new Promise(async (resolve, reject) => {
        let info = reroll === true ? client.giveawaysEnded.get(_info) : _info;
        if(!info) return reject();
        info = client.deepCopy(info);
        if(typeof rerollAmount === 'number' && reroll === true){
            if(rerollAmount > info.winners){
                rerollAmount = info.winners;
            }
        }
        if(reroll === false){
            try{
                await client.dbHandler.deleteValue(`giveaways`, {}, {messageId: info.messageId});
            } catch(err) {
                console.log(err);
            }
            var index = giveaways.indexOf(info.messageId);
            if(index >= 0) giveaways.splice(index, 1);
        }
        const ch = client.channels.cache.get(info.channelId);
        if(!ch) return reject();
        var msg = ch.messages.cache.get(info.messageId);
        if(!msg){
            try{
            	msg = await ch.messages.fetch(info.messageId);
                await wait(400);
            } catch(err) {
                reject(err);
                return;
            }
        }
        var resolved;
        try{
            resolved = await msg.reactions.resolve(`🥳`);
        } catch (err) {
            reject(err);
            return;
        }
        await wait(200);
        var users = new Collection();
        try{
            var userCollection = await resolved.users.fetch({limit: 100});
            users = users.concat(userCollection);
            while(userCollection.size === 100){
                await wait(200);
                let lastUserId = userCollection.lastKey();
                userCollection = await resolved.users.fetch({limit: 100, after: lastUserId});
                users = users.concat(userCollection);
            }
        } catch (err) {
            reject(err);
            return;
        }

        users = users.filter(u => !u.bot);

        await wait(200);

        const now = new Date().getTime();
        const clientEndTimestamp = Math.round((now / 1000));

        var organizor;
        
        try{
            organizor = await client.cache.getUser(info.organizor);
        } catch {
            organizor = {tag: 'Unknown tag', username: 'Unknown username', id: 'Unknown user id'};
        }

        if(users.size === 0){
            const endEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: info.priceName, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, organizor, undefined, ch, messages.giveaway.start['end-embed'].title))
            .setDescription(handleMessage(client, organizor, undefined, ch, messages.giveaway.start['end-embed'].message, [{PRIZE: info.priceName, WINNERS: info.winners, TIMESTAMP: `<t:${clientEndTimestamp}>`, GIVEAWAY_WINNERS: messages.giveaway.start['end-embed']['no-winners-text']}]))
            .setTimestamp(now);

            msg.edit({embeds: [endEmbed]}).catch(err => {});
        } else {
            var winners = [];
            let winnersAmount = reroll === false ? info.winners : (typeof rerollAmount === 'number' ? rerollAmount : info.winners);
            while(winners.length < winnersAmount && users.size > 0){
                var winner = users.random();
                winners.push(winner);
                users.delete(winner.id);
            }
            var winnersText = winners.reduce((text, winner) => {
                text += `\n<@!${winner.id}>`;
                return text;
            }, ``);
            var winnersReply = winners.reduce((text, winner, i) => {
                if(i === (winners.length - 1)) text += `<@!${winner.id}>`;
                else text += `<@!${winner.id}> `;
                return text;
            }, ``);
            const endEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: info.priceName, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, organizor, undefined, ch, messages.giveaway.start['end-embed'].title))
            .setDescription(handleMessage(client, organizor, undefined, ch, messages.giveaway.start['end-embed'].message, [{PRIZE: info.priceName, WINNERS: info.winners, TIMESTAMP: `<t:${clientEndTimestamp}>`, GIVEAWAY_WINNERS: winnersText}]))
            .setTimestamp(now);

            if(reroll === false){
                const removeTimestamp = now + (7 * 24 * 60 * 60 * 1000);

                info['ended'] = now;
                info['removeAt'] = removeTimestamp;
            }
            info['winnersArr'] = winners.map(u => u.id);
            info['ended'] = true;
            try{
                await client.dbHandler.setValue(`giveawaysEnded`, info, {messageId: info.messageId});
            } catch(err) {
                console.log(err);
            }

            msg.edit({embeds: [endEmbed]}).catch(err => {});
            await wait(200);
            msg.reply({content: handleMessage(client, organizor, undefined, ch, messages.giveaway['congrats-message'], [{WINNERS: winnersReply, PRIZE: info.priceName}])}).catch(err => {});

            resolve();
        }
    });
}

function checkGiveaways(_client){
    clearTimeout(timeout1);
    var nextGiveaway = undefined;
    const now = new Date().getTime();
    for(var i = 0; i < giveaways.length; i++){
        var messageId = giveaways[i];
        const info = client.deepCopy(client.giveaways.get(messageId));
        if(now > info.endTimestamp){
            endGiveaway(client, info, false).catch(err => {});
        } else {
            const difference = info.endTimestamp - now + 2e3;
            if(nextGiveaway < difference || typeof nextGiveaway === 'undefined'){
                nextGiveaway = difference;
            }
        }
    }
    if(typeof nextGiveaway === 'undefined'){
        nextGiveaway = hour;
    } else if(nextGiveaway > hour){
        nextGiveaway = hour;
    }
    timeout1 = setTimeout(function(){
        checkGiveaways(client);
    }, nextGiveaway);
}

function handleGiveaway(client, messageid){
    giveaways.push(messageid);
    checkGiveaways(client);
    checkEnded();
}

function reloadGiveaways(_client){
    return new Promise(async resolve => {
        client = _client;
        var loadedGiveaways = [...giveaways];
        giveaways = [...client.giveaways.toReadableArray().map(v => v.value.messageId)];
        giveaways.push(...loadedGiveaways);
        for(var i = 0; i < giveaways.length; i++){
            var id = giveaways[i];
            let info = client.giveaways.get(id);
            if(info){
                info = client.deepCopy(info);
                const ch = client.channels.cache.get(info.channelId);
                if(ch){
                    await wait(1000);
                    ch.messages.fetch(info.messageId).catch(err => {});
                }
            }
        }
        checkGiveaways(client);
        checkEnded();
        console.log(`Reloaded giveaways`);
        resolve();
    });
}

function deleteGiveaway(client, messageId){
    return new Promise(async (resolve, reject) => {
        let info = client.giveaways.get(messageId) || client.giveawaysEnded.get(messageId);
        if(!info) return reject(`No info found`);
        info = client.deepCopy(info);
        const ch = client.channels.cache.get(info.channelId);
        if(!ch) return reject(`Channel does not exist`);
        const msg = ch.messages.cache.get(info.messageId);
        if(!msg) return reject(`Message does not exist`);
        msg.delete().catch(err => {});
        if(info.ended === true){
            try{
                await client.dbHandler.deleteValue(`giveawaysEnded`, {}, {messageId: messageId});
            } catch {}
            checkEnded();
            resolve();
        } else {
            var index = giveaways.indexOf(messageId);
            if(index >= 0) giveaways.splice(index, 1);
            try{
                await client.dbHandler.deleteValue(`giveaways`, {}, {messageId: messageId});
            } catch {}
            checkGiveaways(client);
            resolve();
        }
    });
}

module.exports = function(client){
    return {
        reload: function(){
            return reloadGiveaways(client);
        },
        handle: function(messageId){
            return handleGiveaway(client, messageId);
        },
        end: function(info){
            return endGiveaway(client, info, false);
        },
        reroll: function(messageId, amount){
            amount = /^[0-9]*$/.test(amount) ? parseInt(amount) : undefined;
            return endGiveaway(client, messageId, true, amount);
        },
        delete: function(messageId){
            return deleteGiveaway(client, messageId);
        }
    };
}
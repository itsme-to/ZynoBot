const { EmbedBuilder } = require('discord.js');
const { ValueSaver } = require('valuesaver');
const { wait } = require("./functions.js");
const messages = require('./messages.json');
const handleMessage = require('./handlers/handleMessages.js');

return module.exports = {
    data: {
        name: 'messageReactionAdd',
        type: 'on'
    },
    callback: function(client){
        return async function(reaction, user){
            if(!client.ready) return;
            if(!reaction.message.inGuild()) return;
            if(Object.keys(client.mainguilds).indexOf(reaction.message.guild.id) < 0) return;
            if(client.dbTransfer) return;
            if(user.id === client.user.id) return;

            if(reaction.partial){
                try{
                    await reaction.fetch();
                    await wait(400);
                } catch {
                    return;
                }
            }

            if(client.config.debugger) console.log(`[SYSTEM] Reaction added by user with id ${user.id} in server with id ${reaction.message.guild.id} on message with id ${reaction.message.id}`);

            if(client.giveaways instanceof ValueSaver && client.reactrole instanceof ValueSaver){
                let giveawayInfo = client.giveaways.get(reaction.message.id);
                let reactionMessage = client.reactrole.get(reaction.message.id);
                if(giveawayInfo && reaction.emoji.name === '🥳'){
                    giveawayInfo = client.deepCopy(giveawayInfo);
                    if(typeof giveawayInfo.requirements === 'object' && giveawayInfo.requirements !== null){
                        const userXP = client.deepCopy(client.xp.get(user.id) || []).filter(x => x.guild === reaction.message.guild.id)[0] || {level: 0, xp: 0, messages: 0, guild: reaction.message.guild.id};
                        const invites = client.deepCopy(client.userinfo.get(user.id) || []).filter(i => i.guild === reaction.message.guild.id)[0] || {joins: 1, bans: 0, kicks: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: reaction.message.guild.id};
                        const infoObj = {
                            level: userXP.level,
                            messages: userXP.messages,
                            invites: (invites.invites - invites.inviteleaves)
                        };
                        let additionalRequirements = ``, allowed = true;
                        for(let key in giveawayInfo.requirements){
                            if(key !== 'role'){
                                if(giveawayInfo.requirements[key] > infoObj[key]){
                                    allowed = false;
                                    let addVal = `${giveawayInfo.requirements[key]} ${key}`;
                                    additionalRequirements = additionalRequirements.length > 0 ? additionalRequirements+', '+addVal : addVal;
                                }
                            } else {
                                if(typeof giveawayInfo.requirements['role'] !== 'string') continue;
                                let memberObj = await client.cache.getMember(user.id, reaction.message.guild);
                                if(!memberObj) continue;
                                if(memberObj.roles.cache.filter(r => r.id === giveawayInfo.requirements[key]).size === 0){
                                    allowed = false;
                                    let getRole = await client.cache.getRole(giveawayInfo.requirements[key], reaction.message.guild)
                                    let addVal = `the ${key} ${getRole ? `@${getRole.name}` : `<@&${giveawayInfo.requirements[key]}>`}`;
                                    additionalRequirements = additionalRequirements.length > 0 ? additionalRequirements+', '+addVal : addVal;
                                }
                            }
                        }
                        if(allowed === false){
                            const disallowedReq = new EmbedBuilder()
                            .setColor(client.embedColor)
                            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                            .setTitle(handleMessage(client, user, undefined, reaction.message.channel, messages.giveaway.start.embed.requirements['missing-requirements'].title))
                            .setDescription(handleMessage(client, user, undefined, reaction.message.channel, messages.giveaway.start.embed.requirements['missing-requirements'].message, [{GIVEAWAY_URL: reaction.message.url, REQUIREMENTS: additionalRequirements}]))
                            .setTimestamp();

                            reaction.users.remove(user.id).catch(err => {});

                            await wait(400);

                            return user.send({embeds: [disallowedReq]}).catch(err => {});
                        }
                    }

                    const participated = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, user, undefined, reaction.message.channel, messages.giveaway['confirmation-text'].title))
                    .setDescription(handleMessage(client, user, undefined, reaction.message.channel, messages.giveaway['confirmation-text'].message, [{GIVEAWAY: `[${giveawayInfo.priceName}](${reaction.message.url})`}]))
                    .setTimestamp();

                    user.send({embeds: [participated]}).catch(err => {});
                } else if(reactionMessage){
                    reactionMessage = client.deepCopy(reactionMessage);
                    reaction.users.remove(user).catch(err => {});
                    const getRole = reactionMessage.filter(r => r.emoji === reaction.emoji.toString())[0];
                    if(!getRole) return;
                    var member;
                    try {
                        member = await client.cache.getMember(user.id, reaction.message.guild);
                        await wait(200);
                    } catch {
                        return;
                    }
                    if(member.roles.cache.get(getRole.role)){
                        member.roles.remove(getRole.role).catch(err => {});
                    } else {
                        member.roles.add(getRole.role).catch(err => {});
                    }
                }
            }
            client.clientParser.event.emit('reactionAdd', reaction, user);
        }
    }
}
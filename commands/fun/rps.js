const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions.js');

module.exports = {
    data: {
        name: 'rps',
        description: 'Play rock paper scissors with the bot',
        category: 'Fun',
        options: [{type: 3, name: 'gamemode', description: 'The gamemode you\'d like to play', choices: [{name: 'Multiplayer', value: 'multiplayer'}, {name: 'Singleplayer', value: 'singleplayer'}]}],
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        function genField(member){
            let playEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTimestamp();

            if(!member){
                playEmbed.setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps.start.title));
                playEmbed.setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps.start.message));
            } else {
                playEmbed.setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.fun.rps['start-multiplayer'].title));
                playEmbed.setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.fun.rps['start-multiplayer'].message));
            }
    
            const actionRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setCustomId(`rock`)
                .setLabel(`Rock`)
                .setEmoji(`🪨`),
                new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId(`paper`)
                .setLabel(`Paper`)
                .setEmoji(`📃`),
                new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`scissors`)
                .setLabel(`Scissors`)
                .setEmoji(`✂️`)
            ]);

            return {embeds: [playEmbed], components: [actionRow]};
        }

        let userResponses = {};

        function startGame(msg, member){
            client.interactionInfo.get(`ignore`).set(msg.id, true);
            const userIds = [message.member.id];
            if(member) userIds.push(member.id);
            const filter = i => userIds.indexOf(i.user.id) >= 0 && Object.keys(userResponses).indexOf(i.user.id) < 0 && ['rock', 'paper', 'scissors'].includes(i.customId);
            const collector = msg.createMessageComponentCollector({filter, time: 3*6e4, max: 1});
            collector.on('collect', async i => {
                i.deferUpdate().catch(err => {});
                await wait(4e2);
                userResponses[i.member.id] = i.customId;
                const objectKeys = Object.keys(userResponses);
                for(const memberId of objectKeys){
                    const memberIndex = userIds.indexOf(memberId);
                    if(memberIndex >= 0) userIds.splice(memberIndex);
                }
                if(userIds.length === 0){
                    let endEmbed;
                    const types = [{name: 'Rock', emoji: '🪨'}, {name: 'Paper', emoji: '📃'}, {name: 'Scissors', emoji: '✂️'}];
                    if(!member){
                        const random = types[Math.round(Math.random() * (types.length - 1))];
                        const userType = types.filter(e => e.name.toLowerCase() === i.customId)[0];
                        var lost;
                        if(userType.name === random.name){
                            lost = false;
                        } else if((userType.name === 'Rock' && random.name === 'Paper') || (userType.name === 'Paper' && random.name === 'Scissors') || (userType.name === 'Scissors' && random.name === 'Rock')){
                            lost = true;
                        } else {
                            lost = false;
                        }
                        var bottomText = lost === true ? handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps.end['lost-text']) : (userType.name === random.name ? handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps.end['equal-text']) : handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps.end['won-text']));
                        endEmbed = new EmbedBuilder()
                        .setColor(lost === true ? `Red`: client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps.end.title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps.end.message, [{STATUS: bottomText, BOT_EMOJI: random.emoji, USER_EMOJI: userType.emoji}]))
                        .setTimestamp();
                    } else {
                        const objectValues = Object.values(userResponses);
                        let user1O = objectValues[0];
                        let user2O = objectValues[1];
                        user1O = types.filter(e => e.name.toLowerCase() === user1O)[0];
                        user2O = types.filter(e => e.name.toLowerCase() === user2O)[0];
                        let winner = false;
                        if((user1O.name === 'Rock' && user2O.name === 'Paper') || (user1O.name === 'Paper' && user2O.name === 'Scissors') || (user1O.name === 'Scissors' && user2O.name === 'Rock')){
                            winner = objectKeys[1];
                        } else if(user1O !== user2O) {
                            winner = objectKeys[0];
                        }

                        let bottomText = winner === false ? handleMessage(client, message.member.user, member.user, message.channel, messages.fun.rps['end-multiplayer'].equal) : handleMessage(client, message.member.user, member.user, message.channel, messages.fun.rps['end-multiplayer'].won, [{WINNER: `<@!${winner}>`}])

                        endEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.fun.rps['end-multiplayer'].title))
                        .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.fun.rps['end-multiplayer'].message, [{STATUS: bottomText, USER_EMOJI_1: types.filter(e => e.name.toLowerCase() === userResponses[message.member.id])[0].emoji, USER_EMOJI_2: types.filter(e => e.name.toLowerCase() === userResponses[member.id])[0].emoji}]))
                        .setTimestamp();
                    }
    
                    msg.edit(client.handleContent(message, {embeds: [endEmbed], components: []})).catch(err => {});
                } else {
                    let waitingFor = i.member.id === member.id ? message.member : member;

                    const waitingResponse = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, i.member.user, waitingFor.user, message.channel, messages.fun.rps['waiting-for-response'].title))
                    .setDescription(handleMessage(client, i.member.user, waitingFor.user, message.channel, messages.fun.rps['waiting-for-response'].message))
                    .setTimestamp();

                    msg.edit({embeds: [waitingResponse], components: genField(member).components}).catch(err => {}).then(_msg => {
                        startGame(_msg, member);
                    }).catch(err => {
                        if(client.config.debugger) console.log(err);
                    });
                }
            });

            collector.on('end', () => {
                client.interactionInfo.get(`ignore`).delete(msg.id);
            });
        }

        let gamemode = (args[1] ?? 'singleplayer').toLowerCase();
        if(['multiplayer', 'singleplayer'].indexOf(gamemode) < 0) gamemode = "singleplayer";

        if(gamemode === "multiplayer"){
            const playerJoin = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps['multiplayer-join'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps['multiplayer-join'].message))
            .setTimestamp();

            const joinBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel('Join')
            .setCustomId('join-rps-game');
            const cancelBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setLabel('Cancel')
            .setCustomId('cancel-rps-game');

            const multiplayerActionRow = new ActionRowBuilder().addComponents(joinBtn, cancelBtn);

            sendMessage({embeds: [playerJoin], components: [multiplayerActionRow]}).then(msg => {
                const collector = msg.createMessageComponentCollector({
                    filter: i => (i.customId === 'cancel-rps-game' && i.member.id === message.member.id) || (i.customId === 'join-rps-game' && i.member.id !== message.member.id),
                    max: 1,
                    time: 3*6e4
                });

                collector.once('collect', async i => {
                    i.deferUpdate().catch(err => {});
                    await wait(4e2);
                    if(i.customId === 'cancel-rps-game'){
                        return msg.delete().catch(err => {});
                    } else {
                        msg.edit(genField(i.member)).then(_msg => {
                            startGame(_msg, i.member);
                        }).catch(err => {
                            if(client.config.debugger) console.log(err);
                        })
                    }
                });

                collector.once('end', collected => {
                    if(collected.size === 0){
                        const noPlayerFound = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps['no-2nd-player-found'].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.rps['no-2nd-player-found'].message))
                        .setTimestamp();

                        msg.edit({embeds: [noPlayerFound], components: []}).catch(err => {});
                    }
                });
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            });

        } else {
            sendMessage(genField()).then(msg => {
                startGame(msg, null);
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            });
        }
    }
}
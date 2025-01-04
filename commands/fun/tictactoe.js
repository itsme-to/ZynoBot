const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions.js');
const Canvas = require('@napi-rs/canvas');

module.exports = {
    data: {
        name: 'tictactoe',
        description: 'Play tictactoe against the bot',
        category: 'Fun',
        options: [{type: 3, name: 'gamemode', description: 'The gamemode you\'d like to play', choices: [{name: 'Multiplayer', value: 'multiplayer'}, {name: 'Singleplayer', value: 'singleplayer'}]}],
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const currentGame = client.interactionInfo.get('tictactoe-'+message.member.id+'-'+message.guild.id);
        if(typeof currentGame === 'object'){
            const stillPlaying = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.tictactoe.playing.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.tictactoe.playing.message, [{URL: currentGame.messageurl}]))
            .setTimestamp();

            return sendMessage({embeds: [stillPlaying]}).catch(err => {});
        }

        function genField(member){
            const canvas = Canvas.createCanvas(500, 500);
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = "#2e2e2e";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = client.embedColor;
            var xLine = canvas.width / 3;
            var yLine = canvas.width / 3;
            ctx.fillRect(xLine, 10, 4, canvas.height - 20);
            ctx.fillRect(xLine * 2, 10, 4, canvas.height - 20);
            ctx.fillRect(10, yLine, canvas.width - 20, 4);
            ctx.fillRect(10, yLine * 2, canvas.width - 20, 4);

            const buff = canvas.toBuffer('image/png');
            const tempSave = new AttachmentBuilder().setFile(buff).setName('tictactoe.png');

            const starting = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, member ?? undefined, message.channel, member ? messages.fun.tictactoe.multiplayer['starting-multiplayer'].title : messages.fun.tictactoe.starting.title))
            .setDescription(handleMessage(client, message.member.user, member ?? undefined, message.channel, member ? messages.fun.tictactoe.multiplayer['starting-multiplayer'].message : messages.fun.tictactoe.starting.message, [{USER_TURN: `<@!${message.member.id}>`}]))
            .setImage('attachment://tictactoe.png')
            .setTimestamp();

            const rows = [
                new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r0')
                    .setLabel('👆'),
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r1')
                    .setLabel('👆'),
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r2')
                    .setLabel('👆')
                ),
                new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r3')
                    .setLabel('👆'),
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r4')
                    .setLabel('👆'),
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r5')
                    .setLabel('👆')
                ),
                new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r6')
                    .setLabel('👆'),
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r7')
                    .setLabel('👆'),
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId('tictactoe__r8')
                    .setLabel('👆')
                ),
            ];

            return {embeds: [starting], files: [tempSave], components: rows};
        }

        let gameMode = (args[1] ?? 'singleplayer').toLowerCase();
        if(['singleplayer', 'multiplayer'].indexOf(gameMode) < 0) gameMode = 'singleplayer';

        if(gameMode === "singleplayer"){
            sendMessage(genField()).then(msg => {
                client.interactionInfo.set(`tictactoe-${message.member.id}-${message.guild.id}`, {set: [0, 0, 0, 0, 0, 0, 0, 0, 0], messageurl: msg.url, mode: 'singleplayer', player: 1});
            }).catch(err => {});
        } else {
            const waiting = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.tictactoe.multiplayer['waiting-for-2nd-player'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.tictactoe.multiplayer['waiting-for-2nd-player'].message))
            .setTimestamp();

            const joinBtn = new ButtonBuilder()
            .setCustomId('join-tictactoe-multiplayer')
            .setStyle(ButtonStyle.Primary)
            .setLabel('Join');
            const cancelBtn = new ButtonBuilder()
            .setCustomId('cancel-tictactoe-multiplayer')
            .setStyle(ButtonStyle.Danger)
            .setLabel('Cancel');

            const btnActionRow = new ActionRowBuilder().addComponents(joinBtn, cancelBtn);

            sendMessage({embeds: [waiting], components: [btnActionRow]}).then(msg => {
                const collector = msg.createMessageComponentCollector({
                    max: 1,
                    time: 3*6e4,
                    filter: i => (i.customId === 'cancel-tictactoe-multiplayer' && i.member.id === message.member.id) || (i.customId === 'join-tictactoe-multiplayer' && i.member.id !== message.member.id) && !client.interactionInfo.get(`tictactoe-${i.member.id}-${message.guild.id}`) && !client.interactionInfo.get(`tictactoe-${message.member.id}-${message.guild.id}`)
                });

                collector.once('collect', async i => {
                    i.deferUpdate().catch(err => {});
                    await wait(4e2);
                    if(i.customId === 'cancel-tictactoe-multiplayer' && i.member.id === message.member.id){
                        msg.delete().catch(err => {});
                        collector.stop();
                    } else if(i.customId === 'join-tictactoe-multiplayer'){
                        collector.stop();
                        msg.edit(genField(i.member)).then(_msg => {
                            client.interactionInfo.set(`tictactoe-${message.member.id}-${message.guild.id}`, {set: [0, 0, 0, 0, 0, 0, 0, 0, 0], messageurl: msg.url, mode: 'multiplayer', against: i.member.id, player: 1});
                            client.interactionInfo.set(`tictactoe-${i.member.id}-${message.guild.id}`, {set: [0, 0, 0, 0, 0, 0, 0, 0, 0], messageurl: msg.url, mode: 'multiplayer', against: message.member.id, player: 2});
                        }).catch(err => {
                            if(client.config.debugger) console.log(err);
                        });
                    }
                });

                collector.on('end', collected => {
                    if(collected.size === 0){
                        const noResponse = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.tictactoe.multiplayer['no-2nd-player-found'].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.tictactoe.multiplayer['no-2nd-player-found'].message))
                        .setTimestamp();

                        msg.edit({embeds: [noResponse], components: []}).catch(err => {});
                    }
                })
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            })
        }
    }
}
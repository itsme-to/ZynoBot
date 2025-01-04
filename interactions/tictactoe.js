const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');
const { wait, saveTemporary } = require('../functions');
const Canvas = require('@napi-rs/canvas');
const fs = require('fs');

const combinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

module.exports = {
    data: {
        id: 'tictactoe',
        description: 'Once a user reacted with tic tac toe'
    },
    run: async function(client, interaction){
        const canvas = Canvas.createCanvas(500, 500);
        const ctx = canvas.getContext('2d');

        var rows = [];

        function deleteAction(gI){
            if(gI.mode === "multiplayer"){
                let againstPlayer = gI.against;
                client.interactionInfo.delete(`tictactoe-${interaction.member.user.id}-${interaction.guild.id}`);
                client.interactionInfo.delete(`tictactoe-${againstPlayer}-${interaction.guild.id}`);
            } else {
                client.interactionInfo.delete(`tictactoe-${interaction.member.user.id}-${interaction.guild.id}`);
            }
        }

        function setValue(gI){
            if(gI.mode === "multiplayer"){
                let deepCopy = client.deepCopy(gI);
                deepCopy.against = interaction.member.id;
                deepCopy.player = gI.player === 1 ? 2 : 1;
                client.interactionInfo.set(`tictactoe-${gI.against}-${interaction.guild.id}`, deepCopy);
                client.interactionInfo.set(`tictactoe-${interaction.member.id}-${interaction.guild.id}`, gI);
            } else {
                client.interactionInfo.set(`tictactoe-${interaction.member.id}-${interaction.guild.id}`, gI);
            }
        }

        function drawField(s, a){
            ctx.fillStyle = "#2e2e2e";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = client.embedColor;
            var xLine = canvas.width / 3;
            var yLine = canvas.width / 3;
            ctx.fillRect(xLine, 10, 4, canvas.height - 22);
            ctx.fillRect(xLine * 2, 10, 4, canvas.height - 22);
            ctx.fillRect(10, yLine, canvas.width - 22, 4);
            ctx.fillRect(10, yLine * 2, canvas.width - 22, 4);

            for(var i = 0; i < gameInfo.set.length; i++){
                var modulus = i % 3;
                if(modulus === 0){
                    rows.push([]);
                }
                var val = gameInfo.set[i];
                if(val === 0){
                    var btn = new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId(`tictactoe__r${i}`)
                    .setLabel('👆');
                    if(s === true){
                        btn.setDisabled(true);
                    }
                    rows[(rows.length - 1)].push(btn);
                    continue;
                } else {
                    var btn = new ButtonBuilder()
                    .setStyle(val === 1 ? ButtonStyle.Primary : ButtonStyle.Danger)
                    .setCustomId(`tictactoe__r${i}`)
                    .setLabel('👆')
                    .setDisabled(true);
                    rows[(rows.length - 1)].push(btn);
                }
                var char = val === 1 ? "X" : "O";

                var fontSize = 120;
                ctx.font = `${fontSize}px Default Font`;
                var measure = ctx.measureText(char);
                while(measure.width > (xLine - 50)){
                    fontSize -= 10;
                    ctx.font = `${fontSize}px Default Font`;
                    measure = ctx.measureText(char);
                }
                var column = Math.floor(i / 3);

                var xOffset = xLine * modulus + (xLine - measure.width) / 2;
                var yOffset = yLine * column + (yLine / 4 * 3);

                ctx.fillText(char, xOffset, yOffset);
            }

            if(!!a.length === true){
                ctx.strokeStyle = client.embedColor;
                ctx.lineWidth = 10;

                var userWidth = canvas.width / 3;
                var userHeight = canvas.height / 3;

                var min = Math.min(...a);
                var max = Math.max(...a);

                var column1 = min % 3;
                var column2 = max % 3;
                var row1 = Math.floor(min / 3);
                var row2 = Math.floor(max / 3);

                ctx.beginPath();
                ctx.moveTo(column1 * userWidth + userWidth / 2, row1 * userHeight + userHeight / 2);
                ctx.lineTo(column2 * userWidth + userWidth / 2, row2 * userHeight + userHeight / 2);
                ctx.stroke();
            }
        }

        function checkWin(set, n){
            var won = [];
            for(var i = 0; i < combinations.length; i++){
                var combination = combinations[i];
                var getUserCombination = combination.map(i => set[i]);
                if(getUserCombination.filter(r => r === n).length === 3) return combination;
            }
            return won;
        }

        function getBestMove(set){
            var winningMoves = [];
            var losingMoves = [];
            for(var i = 0; i < combinations.length; i++){
                var combination = combinations[i];
                var filledInCombinations = combination.map(r => set[r] !== 0);
                if(filledInCombinations.filter(v => v === true).length === 2){
                    var index1 = filledInCombinations.indexOf(true);
                    var index2 = filledInCombinations.lastIndexOf(true);
                    if(set[combination[index1]] === set[combination[index2]]){
                        if(set[combination[index1]] === 1){
                            var index = filledInCombinations.indexOf(false);
                            losingMoves.push(combination[index]);
                        } else {
                            var index = filledInCombinations.indexOf(false);
                            winningMoves.push(combination[index]);
                        }
                    }
                }
            }
            if(winningMoves.length > 0){
                return winningMoves[0];
            } else if(losingMoves.length > 0){
                return losingMoves[0];
            } else {
                var randNumb = Math.round(Math.random() * 8);
                while(set[randNumb] !== 0){
                    randNumb = Math.round(Math.random() * 8);
                }
                return randNumb;
            }
        }

        function sendTTT(a, gI){
            return new Promise(resolve => {
                var imageBuffer = canvas.toBuffer('image/png');
                let tempSave = new AttachmentBuilder().setFile(imageBuffer).setName('tictactoe.png');

                var embed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setImage('attachment://tictactoe.png')
                .setTimestamp();
                if(gI.mode === "singleplayer"){
                    if(!!a.length === false){
                        embed.setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.fun.tictactoe.starting.title))
                        embed.setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.fun.tictactoe.starting.message))
                    } else if(a[0] === 1){
                        embed.setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.fun.tictactoe.won.title))
                        embed.setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.fun.tictactoe.won.message))
                    } else if(a[0] === 2){
                        embed.setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.fun.tictactoe.lost.title))
                        embed.setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.fun.tictactoe.lost.message))
                    } else {
                        embed.setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.fun.tictactoe.draw.title))
                        embed.setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.fun.tictactoe.draw.message))
                    }
                } else {
                    let againstMember = interaction.guild.members.cache.get(gI.against);
                    let againstInfo = client.interactionInfo.get(`tictactoe-${gI.against}-${interaction.guild.id}`);

                    if(!!a.length === false){
                        embed.setTitle(handleMessage(client, interaction.member.user, againstMember, interaction.channel, messages.fun.tictactoe.multiplayer['starting-multiplayer'].title))
                        embed.setDescription(handleMessage(client, interaction.member.user, againstMember, interaction.channel, messages.fun.tictactoe.multiplayer['starting-multiplayer'].message, [{USER_TURN: `<@!${againstMember.id}>`}]))
                    } else if(a[0] === 1 || a[0] === 2){
                        let player1 = gI.player === 1 ? interaction.member : againstMember;
                        let player2 = gI.player === 2 ? interaction.member : againstMember;

                        embed.setTitle(handleMessage(client, interaction.member.user, againstMember, interaction.channel, messages.fun.tictactoe.multiplayer.won.title, [{WINNER: a[0] === 1 ? `<@!${player1.id}>` : `<@!${player2.id}>`, LOSER: a[0] === 1 ? `<@!${player2.id}>` : `<@!${player1.id}>`}]));
                        embed.setDescription(handleMessage(client, interaction.member.user, againstMember, interaction.channel, messages.fun.tictactoe.multiplayer.won.message, [{WINNER: a[0] === 1 ? `<@!${player1.id}>` : `<@!${player2.id}>`, LOSER: a[0] === 1 ? `<@!${player2.id}>` : `<@!${player1.id}>`}]));
                    } else {
                        embed.setTitle(handleMessage(client, interaction.member.user, againstMember, interaction.channel, messages.fun.tictactoe.multiplayer.draw.title))
                        embed.setDescription(handleMessage(client, interaction.member.user, againstMember, interaction.channel, messages.fun.tictactoe.multiplayer.draw.message))
                    }
                }

                interaction.message.edit({embeds: [embed], files: [tempSave], components: rows.map(r => new ActionRowBuilder().addComponents(...r))}).then(msg => {
                    setValue(gameInfo);
                    resolve();
                }).catch(err => {
                    console.log(`Error while updating tic tac toe: `, err);
                    resolve();
                });
            });
        }

        const gameInfo = client.interactionInfo.get(`tictactoe-${interaction.member.user.id}-${interaction.guild.id}`);
        if(!gameInfo) return interaction.deferUpdate().catch(err => {});
        if(gameInfo.messageurl !== interaction.message.url) return interaction.deferUpdate().catch(err => {});

        interaction.deferUpdate().catch(err => {});
        await wait(200);

        if(gameInfo.mode === "multiplayer"){
            let p2S = gameInfo.set.filter(s => s === 2);
            let p1S = gameInfo.set.filter(s => s === 1);
            if(p1S.length > p2S.length && gameInfo.player === 1){
                return;
            } else if(p2S.length >= p1S.length && gameInfo.player === 2){
                return;
            }
        }

        var chosenIndex = parseInt(interaction.customId.split('__r')[1]);
        gameInfo.set[chosenIndex] = gameInfo.player;

        var won = checkWin(gameInfo.set, gameInfo.player);
        if(!!won.length === true){
            drawField(true, won);
            await sendTTT([gameInfo.player], gameInfo);
            deleteAction(gameInfo);
            return;
        } else if(gameInfo.set.filter(r => r === 0).length === 0){
            drawField(true, won);
            await sendTTT([0], gameInfo);
            deleteAction(gameInfo);
            return;
        }

        if(gameInfo.mode === "singleplayer"){
            var nextMove = getBestMove(gameInfo.set);
            gameInfo.set[nextMove] = 2;

            var computerWon = checkWin(gameInfo.set, 2);
            if(!!computerWon.length === true){
                drawField(true, computerWon);
                await sendTTT([2], gameInfo);
                deleteAction(gameInfo);
                return;
            }

            drawField(false, computerWon);
        } else {
            drawField(false, false);
        }

        await sendTTT([], gameInfo);
    }
}
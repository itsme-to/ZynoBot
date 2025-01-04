const { EmbedBuilder } = require("discord.js");
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

function firstUpperCase(string){
    var firstLetter = string.slice(0, 1);
    var newString = firstLetter.toUpperCase() + string.slice(1, string.length);
    return newString;
}

module.exports = {
    data: {
        name: 'roulette',
        description: 'Play roulette and try to make more money',
        options: [{type: 10, name: 'money', description: 'The amount of money you want to gamble with', required: true}, {type: 3, name: 'bet', description: 'Bet on which color the ball comes', choices: [{
            name: 'Red',
            value: 'red'
        }, {
            name: 'Black',
            value: 'black'
        }, {
            name: 'Green',
            value: 'green'
        }], required: true}],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);
        
        const userEconomy = handle.getUser(client, message.member.id, message);
        const guildEconomy = userEconomy.filter(e => e.guild === message.guild.id)[0];

        const noMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["no-money-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["no-money-provided"].message))
        .setTimestamp();
        const invalidMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["invalid-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["invalid-money"].message))
        .setTimestamp();
        const minimumMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["minimum-roulette"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["minimum-roulette"].message, [{BET: `🪙 ${messages["economy-cmds"].roulette["minimum-roulette"].minimum}`}]))
        .setTimestamp();
        const notEnough = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["not-enough-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["not-enough-money"].message))
        .setTimestamp();

        const invalidBet = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["no-bet-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["no-bet-provided"].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noMoney]}).catch(err => {});
        if(!Number(args[1])) return sendMessage({embeds: [invalidMoney]}).catch(err => {});
        if(Number(args[1]) < messages["economy-cmds"].roulette["minimum-roulette"].minimum) return sendMessage({embeds: [minimumMoney]}).catch(err => {});
        if(Number(args[1]) > guildEconomy.cash) return sendMessage({embeds: [notEnough]}).catch(err => {});

        const validBets = ['red', 'black', 'green'];
        if(!args[2]) return sendMessage({embeds: [invalidBet]}).catch(err => {});
        if(validBets.indexOf(args[2].toLowerCase()) < 0) return sendMessage({embeds: [invalidBet]}).catch(err => {});

        const endNumber = Math.round(Math.random() * 36);

        var won;
        if(endNumber === 0){
            won = `green`;
        } else if(endNumber <= 10){
            if(endNumber % 2 === 0){
                won = `black`;
            } else {
                won = `red`;
            }
        } else if(endNumber <= 20){
            if(endNumber % 2 === 0){
                won = `red`;
            } else {
                won = `black`;
            }
        } else if(endNumber <= 28){
            if(endNumber % 2 === 0){
                won = `black`;
            } else {
                won = `red`;
            }
        } else {
            if(endNumber % 2 === 0){
                won = `red`;
            } else {
                won = `black`;
            }
        }

        const endEmbed = new EmbedBuilder()
        .setColor(won === args[2].toLowerCase() ? client.embedColor : `Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["end-embed"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].roulette["end-embed"].message, [{COLOR: firstUpperCase(args[2].toLowerCase()), EMOJI_COLOR: `:${args[2].toLowerCase()}_circle:`, WIN_COLOR: firstUpperCase(won), EMOJI_WIN_COLOR: `:${won}_circle:`, STATUS: won === args[2].toLowerCase() ? messages["economy-cmds"].roulette["end-embed"]["won-text"]: messages["economy-cmds"].roulette["end-embed"]["lost-text"], MONEY: `🪙 ${won === args[2].toLowerCase() && won === `green` ? Number(args[1]) * 4 : args[1]}`, BET_MONEY: `🪙 ${args[1]}`}]))
        .setTimestamp();

        if(won === args[2].toLowerCase()){
            guildEconomy.cash += won === `green` ? Number(args[1]) * 4 : Number(args[1]);
        } else {
            guildEconomy.cash -= Number(args[1]);
        }
        
        try{
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
        } catch {}
        sendMessage({embeds: [endEmbed]}).catch(err => {});
    }
}
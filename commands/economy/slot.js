const { EmbedBuilder } = require("discord.js");
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'slot',
        description: 'Play with the machineslot and try to make more money',
        options: [{type: 10, name: 'money', description: 'The amount of money you want to gamble with', required: true}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["no-money-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["no-money-provided"].message))
        .setTimestamp();
        const invalidMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["invalid-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["invalid-money"].message))
        .setTimestamp();
        const minimumMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["minimum-slot"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["minimum-slot"].message, [{BET: `🪙 ${messages["economy-cmds"].slot["minimum-slot"].minimum}`}]))
        .setTimestamp();
        const notEnough = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["not-enough-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["not-enough-money"].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noMoney]}).catch(err => {});
        if(!Number(args[1])) return sendMessage({embeds: [invalidMoney]}).catch(err => {});
        if(Number(args[1]) < messages["economy-cmds"].slot["minimum-slot"].minimum) return sendMessage({embeds: [minimumMoney]}).catch(err => {});
        if(Number(args[1]) > guildEconomy.cash) return sendMessage({embeds: [notEnough]}).catch(err => {});

        var joker = Math.round(Math.random() * 8) === 1 ? true : false;
        const machine = [];
        const upperMachine = [];
        const lowerMachine = [];
        if(joker === true) machine.push('🃏');
        const slots = ['🍋', '💰', '👑', '⭐', '🧭', '🪙'];
        var maxIndex = machine.length === 0 ? 3 : 2;

        for(var i = 0; i < maxIndex; i++){
            if(i === 1){
                const slot = Math.round(Math.random() * 5) <= 2 ? machine[(machine.length - 1)] : slots[Math.round(Math.random() * (slots.length - 1))];
                machine.push(slot);
            } else if(i === 0){
                const slot = slots[Math.round(Math.random() * (slots.length - 1))];
                machine.push(slot);
            } else if(i === 2){
                const slot = Math.round(Math.random() * 6) <= 2 ? machine[(machine.length - 1)] : slots[Math.round(Math.random() * (slots.length - 1))];
                machine.push(slot);
            }
        }

        for(var i = 0; i < 6; i++){
            const slot = slots[Math.round(Math.random() * (slots.length - 1))];
            if(i < 3){
                upperMachine.push(slot);
            } else {
                lowerMachine.push(slot);
            }
        }

        var status = true;
        for(var i = 1; i < machine.length; i++){
            const slot = machine[i];
            if(!((slot === machine[i - 1] || machine[i - 1] === '🃏') && status === true)){
                status = false;
            }
        }

        if(status === true){
            guildEconomy.cash += Number(args[1]) * 3;
        } else {
            guildEconomy.cash -= Number(args[1]);
        }

        try{
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
        } catch {}

        const endEmbed = new EmbedBuilder()
        .setColor(status === true ? client.embedColor : `Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["gamble-embed"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].slot["gamble-embed"].message, [{MONEY: `🪙 ${Number(args[1])}`, STATUS: status === true ? messages["economy-cmds"].slot["gamble-embed"]["won-text"]: messages["economy-cmds"].slot["gamble-embed"]["lost-text"], STATUS_MONEY: status === true ? `🪙 ${Number(args[1]) * 3}` : `🪙 ${Number(args[1])}`, MAINSLOT: machine.join(' '), UPPERSLOT: upperMachine.join(' '), LOWERSLOT: lowerMachine.join(' ')}]))
        .setTimestamp();

        sendMessage({embeds: [endEmbed]}).catch(err => {});
    }
}
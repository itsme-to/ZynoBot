const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'blackjack',
        description: 'Play blackjack to double your money',
        options: [{type: 3, name: 'money', description: 'The amount of money you want to gamble with', required: true}],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const userEconomy = handle.getUser(client, message.member.id, message).filter(e => e.guild === message.guild.id)[0];

        const noMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["no-money-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["no-money-provided"].message))
        .setTimestamp();
        const invalidMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["invalid-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["invalid-money"].message))
        .setTimestamp();
        const minimumMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["minimum-blackjack"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["minimum-blackjack"].message, [{BET: `🪙 ${messages["economy-cmds"].blackjack["minimum-blackjack"].minimum}`}]))
        .setTimestamp();
        const notEnough = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["not-enough-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["not-enough-money"].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noMoney]}).catch(err => {});
        if(!Number(args[1])) return sendMessage({embeds: [invalidMoney]}).catch(err => {});
        if(Number(args[1]) < messages["economy-cmds"].blackjack["minimum-blackjack"].minimum) return sendMessage({embeds: [minimumMoney]}).catch(err => {});
        if(Number(args[1]) > userEconomy.cash) return sendMessage({embeds: [notEnough]}).catch(err => {});

        const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10];
        const startNumber = cards[Math.round(Math.random() * (cards.length - 1))];
        const dealerCard = cards[Math.round(Math.random() * (cards.length - 1))];

        const playingEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["playing-embed"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].blackjack["playing-embed"].message, [{BET_MONEY: `🪙 ${Number(args[1])}`, CARDS: startNumber, DEALER_CARD: dealerCard}]))
        .setTimestamp();

        const row = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setCustomId(`hit-blackjack`)
            .setEmoji(`🃏`)
            .setLabel(`Hit`)
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId(`stand-blackjack`)
            .setEmoji(`✋`)
            .setLabel(`Stand`)
            .setStyle(ButtonStyle.Secondary)
        ]);

        sendMessage({embeds: [playingEmbed], components: [row]}).then(msg => {
            client.interactionInfo.get(`blackjack`).set(msg.id, {msgId: msg.id, user: message.member.id, cards: startNumber, bet: Number(args[1]), dealer: dealerCard});
        }).catch(err => {});
    }
};
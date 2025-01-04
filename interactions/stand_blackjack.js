const { EmbedBuilder } = require("discord.js");
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');
const handle = require('../handlers/economy.js');

function wait(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    data: {
        id: 'stand-blackjack',
        description: 'When the user presses the stand button with blackjack'
    },
    run: async function(client, interaction){
        const replyMessage = client.replyMessage(interaction.message, false, interaction.message);
        interaction.deferUpdate().catch(err => {});

        await wait(200);

        const interactionInfo = client.interactionInfo.get(`blackjack`);

        const userEconomy = handle.getUser(client, interaction.member.id, interaction);
        const guildEconomy = userEconomy.filter(e => e.guild === interaction.guild.id)[0];

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["unknown-interaction"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["unknown-interaction"].message))
        .setTimestamp();

        const info = interactionInfo.get(interaction.message.id);

        if(!info) return interaction.message.edit({embeds: [unknownInteraction], components: []}).catch(err => {});

        if(interaction.member.id !== info.user) return interaction.deferUpdate().catch(err => {});

        const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10];

        var dealerCards = 0;
        while(dealerCards < info.cards){
            const randomCard = cards[Math.round(Math.random() * (cards.length - 1))];
            dealerCards += randomCard;
        }

        if(dealerCards > info.cards && dealerCards <= 21){

            guildEconomy.cash -= info.bet;

            const lostEmbed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].end["end-message"], [{CARDS: info.cards, BET_MONEY: `🪙 ${info.bet}`, DEALER_CARDS: dealerCards, STATUS: messages["economy-cmds"].blackjack["playing-embed"]["lost-text"], RESULT_MONEY: `🪙 ${info.bet}`}]))
            .setTimestamp();

            try{
                await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: interaction.member.id, guildId: interaction.guild.id});
            } catch {}

            replyMessage({embeds: [lostEmbed], components: []}).then(() => {
            	interactionInfo.delete(interaction.message.id);
            }).catch(err => {});
        
        } else if(dealerCards === info.cards){

            const pushEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].end["push-message"], [{CARDS: info.cards, BET_MONEY: `🪙 ${info.bet}`, DEALER_CARDS: dealerCards, RESULT_MONEY: `🪙 ${info.bet}`}]))
            .setTimestamp();

            replyMessage({embeds: [pushEmbed], components: []}).then(() => {
            	interactionInfo.delete(interaction.message.id);
            }).catch(err => {});

        } else {

            guildEconomy.cash += Math.round(Number(info.bet) * 1.5);

            const winEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].end["end-message"], [{CARDS: info.cards, BET_MONEY: `🪙 ${Number(info.bet)}`, DEALER_CARDS: dealerCards, STATUS: messages["economy-cmds"].blackjack["playing-embed"]["won-text"], RESULT_MONEY: `🪙 ${Math.round(Number(info.bet) * 1.5)}`}]))
            .setTimestamp();

            try{
                await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: interaction.member.id, guildId: interaction.guild.id});
            } catch {}
            
            replyMessage({embeds: [winEmbed], components: []}).then(() => {
            	interactionInfo.delete(interaction.message.id);
            }).catch(err => {});
            
        }
    }
};
const { EmbedBuilder } = require("discord.js");
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');
const handle = require('../handlers/economy.js');

function wait(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    data: {
        id: 'hit-blackjack',
        description: 'When the user presses the hit button with blackjack'
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
        const number = cards[Math.round(Math.random() * (cards.length - 1))];

        const newCards = info.cards + number;
        if(newCards > 21){
            guildEconomy.cash -= info.bet;

            const busted = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].end["busted-message"], [{CARDS: newCards, BET_MONEY: `🪙 ${info.bet}`}]))
            .setTimestamp();            

            interactionInfo.delete(interaction.message.id);

            try{
                await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: interaction.member.id, guildId: interaction.guild.id});
            } catch {}

            replyMessage({embeds: [busted], components: []}).catch(err => {});
        } else {
            const embed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].blackjack["playing-embed"].message, [{BET_MONEY: `🪙 ${Number(info.bet)}`, CARDS: newCards, DEALER_CARD: info.dealer}]))
            .setTimestamp();

            info.cards = newCards;
            interactionInfo.set(interaction.message.id, info);

            replyMessage({embeds: [embed]}).catch(err => {});
        }
    }
}
const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const { validateEmote, validateDiscordEmote } = require("../../../functions");
const GraphemeSplitter = require("grapheme-splitter");

const splitter = new GraphemeSplitter();

module.exports = {
    data: {
        id: 'create-new-shop-item',
        description: 'When a member has provided the information for a new shop item'
    },
    run: function(client, interaction){
        const name = interaction.fields.getTextInputValue('name');
        const description = interaction.fields.getTextInputValue('description');
        const price = interaction.fields.getTextInputValue('price');
        let stock = interaction.fields.getTextInputValue('stock') ?? '';
        let emoji = interaction.fields.getTextInputValue('emoji') ?? '';

        const identifier = interaction.customId.split('__')[1];

        const invalidPrice = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle('Invalid price')
        .setDescription('The price must be a number.')
        .setTimestamp();

        if(!/^[0-9]*$/.test(price)) return interaction.update({embeds: [invalidPrice], components: []});

        const invalidStock = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle('Invalid stock')
        .setDescription('The stock must be a number.')
        .setTimestamp();

        if(!/^[0-9]*$/.test(stock) && stock.length > 0) return interaction.update({embeds: [invalidStock], components: []});

        if(stock.length === 0) stock = 'Infinity';
        else stock = parseInt(stock);

        const invalidEmoji = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle('Invalid emoji')
        .setDescription('The emoji must be one valid Discord or regular emoji.')
        .setTimestamp();

        if(!validateEmote(emoji) && !validateDiscordEmote(emoji) && emoji.length > 0) return interaction.update({embeds: [invalidEmoji], components: []}).catch(err => {});
        else if(splitter.splitGraphemes(emoji).length > 1) return interaction.update({embeds: [invalidEmoji], components: []}).catch(err => {});
        if(emoji.length === 0) emoji = null;

        client.interactionActions.set(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`, {name: name, description: description, price: parseInt(price), stock: stock, emoji: emoji, role: null});

        const reward = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Reward`)
        .setDescription(`Please select in the select menu below how you would like to reward any member who purchases this item.`)
        .setTimestamp();

        const rewardSelect = new StringSelectMenuBuilder()
        .setCustomId(`reward-new-shop-item${identifier ? `__${identifier}` : ``}`)
        .setPlaceholder('No reward selected')
        .setOptions([{
            label: 'Role',
            value: 'role',
            description: 'Reward the member by providing them a role'
        }, {
            label: 'Nothing',
            value: 'nothing',
            description: 'Don\'t reward the member'
        }, {
            label: 'Cancel',
            value: 'cancel',
            description: 'Cancel this action'
        }]);

        const rewardActionRow = new ActionRowBuilder().addComponents(rewardSelect);

        interaction.update({embeds: [reward], components: [rewardActionRow]}).catch(err => {});
    }
}
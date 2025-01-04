const { EmbedBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");

module.exports = {
    data: {
        id: 'edit-shop-item',
        description: 'When a member wants to edit an existing shop item'
    },
    run: function(client, interaction){
        const item = interaction.values[0].toLowerCase();

        if(item === "cancel"){
            const itemCancelled = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Action cancelled`)
            .setDescription(`The action to eidt an existing shop item has been cancelled.`)
            .setTimestamp();

            return interaction.update({embeds: [itemCancelled], components: []});
        }

        const itemNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Item not found`)
        .setDescription(`The item you provided couldn't be found.`)
        .setTimestamp();

        let shopItems = client.deepCopy(client.shop.get(interaction.guild.id) ?? []).sort((a, b) => {
            return a.price - b.price;
        });
        let shopItem = shopItems.filter(i => i.identifier.toLowerCase() === item.toLowerCase())[0];
        if(!shopItem) return interaction.update({embeds: [itemNotFound], components: []}).catch(err => {});

        const itemModal = new ModalBuilder()
        .setTitle('Create a new item')
        .setCustomId(`create-new-shop-item__${shopItem.identifier}`);
        
        const nameInput = new TextInputBuilder()
        .setLabel('Product name')
        .setRequired(true)
        .setMaxLength(30)
        .setMinLength(1)
        .setCustomId('name')
        .setPlaceholder('No name provided (required)')
        .setValue(shopItem.name)
        .setStyle(TextInputStyle.Short);
        const priceInput = new TextInputBuilder()
        .setLabel('Product price')
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(11)
        .setCustomId('price')
        .setPlaceholder('No price provided (required)')
        .setValue(shopItem.price.toString())
        .setStyle(TextInputStyle.Short);
        const emojiInput = new TextInputBuilder()
        .setLabel('Emoji')
        .setRequired(false)
        .setMaxLength(30)
        .setCustomId('emoji')
        .setPlaceholder('No emoji provided (not required)')
        .setValue(shopItem.emoji ?? '')
        .setStyle(TextInputStyle.Short);
        const stockInput = new TextInputBuilder()
        .setLabel('Stock')
        .setRequired(false)
        .setMaxLength(11)
        .setCustomId('stock')
        .setPlaceholder('No stock provided (not required)')
        .setValue((shopItem.stock ?? '').toString())
        .setStyle(TextInputStyle.Short);
        const descriptionInput = new TextInputBuilder()
        .setLabel('Product description')
        .setRequired(true)
        .setMaxLength(200)
        .setMinLength(1)
        .setCustomId('description')
        .setPlaceholder('No description provided (required)')
        .setValue(shopItem.description)
        .setStyle(TextInputStyle.Paragraph);

        itemModal.addComponents(new ActionRowBuilder().setComponents(nameInput), new ActionRowBuilder().setComponents(priceInput), new ActionRowBuilder().setComponents(emojiInput), new ActionRowBuilder().setComponents(stockInput), new ActionRowBuilder().setComponents(descriptionInput));

        interaction.showModal(itemModal).catch(err => {});
    }
}
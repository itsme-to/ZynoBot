const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'remove-shop-item',
        description: 'When a member wants to remove an item from the shop'
    },
    run: async function(client, interaction){
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

        try{
            await client.dbHandler.deleteValue(`shop`, {}, {identifier: shopItem.identifier, guildId: interaction.guild.id});
        } catch {}

        const itemRemoved = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Item removed`)
        .setDescription(`The item has successfully been removed from the store.`)
        .setTimestamp();

        interaction.update({embeds: [itemRemoved], components: []}).catch(err => {});
    }
}
const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'select-action-ticket-category',
        description: 'When an action gets selected from the select menu'
    },
    run: function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        let emptyCategory = {};
        emptyCategory[interaction.guild.id] = [];
        let categories = client.deepCopy((client.globals.get(`ticket-categories`) || emptyCategory));
        if(!categories[interaction.guild.id]){
            categories[interaction.guild.id] = [];
        }

        switch(type){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change a ticket category has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'remove':
                if(categories[interaction.guild.id].length === 0){
                    const noCategories = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`No categories`)
                    .setDescription(`There are no ticket categories to remove from the ticket categories.`)
                    .setTimestamp();

                    return interaction.update({embeds: [noCategories], components: []}).catch(err => {});
                }

                const categoryOptions = categories[interaction.guild.id].reduce((arr, cat) => {
                    arr.push({
                        label: cat.name,
                        value: cat.name.toLowerCase().split(' ').join('-')
                    });
                    return arr;
                }, []);

                categoryOptions.push({
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                });

                const removeSelect = new StringSelectMenuBuilder()
                .setCustomId(`remove-ticket-category`)
                .setPlaceholder(`No category selected`)
                .setOptions(categoryOptions);

                const removeActionRow = new ActionRowBuilder().addComponents(removeSelect);

                const removeEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select a ticket category`)
                .setDescription(`Select a ticket category in the select menu below to remove it`)
                .setTimestamp();

                interaction.update({embeds: [removeEmbed], components: [removeActionRow]}).catch(err => {});
                break;
            case 'add':
                if(categories[interaction.guild.id].length >= 9){
                    const maxEmbed = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Max categories`)
                    .setDescription(`You've already reached the max amount of ticket categories of 9. Please remove a ticket category before adding a new one.`)
                    .setTimestamp();

                    return interaction.update({embeds: [maxEmbed], components: []}).catch(err => {});
                }

                const categoryInput = new TextInputBuilder()
                .setCustomId(`category-input`)
                .setMaxLength(30)
                .setMinLength(3)
                .setPlaceholder(`No input given`)
                .setLabel(`Category name`)
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

                const categoryActionRow = new ActionRowBuilder().addComponents(categoryInput);

                const categoryModal = new ModalBuilder()
                .setCustomId(`ticket-category-modal`)
                .setTitle(`Add a category`)
                .addComponents(categoryActionRow);

                interaction.showModal(categoryModal).catch(err => {});
                break;
        }
    }
}
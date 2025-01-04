const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'ticket-category-modal',
        description: 'When the name of the name category has been provided'
    },
    run: function(client, interaction){
        const name = interaction.fields.getTextInputValue(`category-input`);

        const invalidCategory = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Invalid category name`)
        .setDescription(`The name of the category may only contain letters, numbers and spaces and must be between 1 and 30 characters long.`)
        .setTimestamp();

        let regEx = /^[А-Яа-яЁёA-zÀ-ÿ0-9\u0621-\u064A\u0100-\u017F ]{1,30}$/;
        if(!regEx.test(name)) return interaction.update({embeds: [invalidCategory], components: []}).catch(err => {});

        const categoryExist = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Category already exist`)
        .setDescription(`There is already another category with this name`)
        .setTimestamp();

        let emptyCategory = {};
        emptyCategory[interaction.guild.id] = [];
        var categories = client.deepCopy((client.globals.get(`ticket-categories`) || emptyCategory));
        if(!categories[interaction.guild.id]) categories[interaction.guild.id] = [];
        if((categories[interaction.guild.id] || []).filter(c => c.name.toLowerCase() === name.toLowerCase()).length > 0) return interaction.update({embeds: [categoryExist], components: []}).catch(err => {});

        client.interactionActions.set(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`, {name: name});

        const colorEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Choose a color`)
        .setDescription(`Choose a color to set for the ticket category button`)
        .setTimestamp();

        const selectColor = new StringSelectMenuBuilder()
        .setCustomId(`select-color-ticket-category`)
        .setPlaceholder(`No color selected`)
        .setOptions([{
            label: 'Blurple',
            value: 'PRIMARY'
        }, {
            label: 'Green',
            value: 'SUCCESS'
        }, {
            label: 'Gray',
            value: 'SECONDARY'
        }, {
            label: 'Red',
            value: 'DANGER'
        }, {
            label: 'Cancel',
            value: 'cancel',
            description: 'Cancel this action'
        }]);

        const selectActionRow = new ActionRowBuilder().addComponents(selectColor);

        interaction.update({embeds: [colorEmbed], components: [selectActionRow]}).catch(err => {});
    }
}
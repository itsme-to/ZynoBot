const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'select-ticket-category-questions',
        description: 'When a member has decided for which ticket category (s)he wants to add or remove questions'
    },
    run: function(client, interaction){
        const cancelled = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to add or remove questions for a ticket category has been cancelled.`)
        .setTimestamp();

        if(interaction.values[0].toLowerCase() === "cancel") return interaction.update({embeds: [cancelled], components: []}).catch(err => {});

        const categoryIndex = interaction.values[0].toLowerCase().split("i-")[1];

        const categoryNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Category not found`)
        .setDescription(`The ticket category you want to add or remove questions for wasn't found.`)
        .setTimestamp();

        if(!/^[0-9]{1,2}$/.test(categoryIndex)) return interaction.update({embeds: [categoryNotFound]}).catch(err => {});

        const categories = client.deepCopy(client.globals.get('ticket-categories') ?? {})[interaction.guild.id] ?? [];        
        const parseIndex = parseInt(categoryIndex);

        if(parseIndex >= categories.length) return interaction.update({embeds: [categoryNotFound], components: []}).catch(err => {});

        const actionEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action`)
        .setDescription(`Please select the action you'd like to perform for the ticket category \`${categories[parseIndex].name}\`.`)
        .setTimestamp();

        const actions = new StringSelectMenuBuilder()
        .setCustomId('select-action-ticket-questions')
        .setPlaceholder('No action selected')
        .setOptions([{
            label: 'Add',
            value: 'add',
            description: 'Add questions for the ticket category',
        }, {
            label: 'Remove',
            value: 'remove',
            description: 'Remove questions for the ticket category'
        }, {
            label: 'Cancel',
            value: 'cancel',
            description: 'Cancel this action'
        }]);

        client.interactionActions.set(`manage-questions-${interaction.member.id}-${interaction.guild.id}`, {category: categories[parseIndex].name});

        const actionRow = new ActionRowBuilder().addComponents(actions);

        interaction.update({embeds: [actionEmbed], components: [actionRow]}).catch(err => {});
    }
}
const { EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'remove-ticket-category',
        description: 'When the user wants to delete a ticket category'
    },
    run: function(client, interaction){
        const category = interaction.values[0].toLowerCase();

        switch(category){
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to remove a ticket category has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            default:
                let emptyCategory = {};
                emptyCategory[interaction.guild.id] = [];
                const categories = client.deepCopy((client.globals.get(`ticket-categories`) || emptyCategory));
                if(!categories[interaction.guild.id]) categories[interaction.guild.id] = [];
                var categoryName = category.split('-').join(' ');

                const categoryNotFound = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Ticket category not found`)
                .setDescription(`The ticket category you're trying to remove cannot be found.`)
                .setTimestamp();

                var filter = (categories[interaction.guild.id] || []).filter(c => c.name.toLowerCase() === categoryName);
                if(filter.length === 0) return interaction.update({embeds: [categoryNotFound], components: []}).catch(err => {});

                const confirmEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Confirm your action`)
                .setDescription(`Are you sure that you want to remove the ticket category `+"`"+filter[0].name+"`"+`?`)
                .setTimestamp();

                const confirmBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId(`confirm-remove-ticket-category`)
                .setLabel(`Confirm`);
                const cancelBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`cancel-remove-ticket-category`)
                .setLabel(`Cancel`);

                const confirmActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

                client.interactionActions.set(`remove-ticket-category-${interaction.member.id}-${interaction.guild.id}`, filter[0]);

                interaction.update({embeds: [confirmEmbed], components: [confirmActionRow]}).catch(err => {});
                break;
        }
    }
}
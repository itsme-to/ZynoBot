const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require("discord.js");

function getColorName(color){
    var style = color.toLowerCase();
    switch(style){
        case 'primary':
            return 'blurple';
            break;
        case 'secondary':
            return 'gray';
            break;
        case 'danger':
            return 'red';
            break;
        case 'success':
            return 'green';
            break;
    }
}

module.exports = {
    data: {
        id: 'select-color-ticket-category',
        description: 'When the user has selected a color for the category button'
    },
    run: function(client, interaction){
        const color = interaction.values[0].toLowerCase();

        switch(color){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change a ticket category has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            default:
                const obj = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);
                
                const unknownInteraction = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Unknown interaction`)
                .setDescription(`The interaction was unknown, please try it again`)
                .setTimestamp();

                if(!obj) return interaction.update({embeds: [unknownInteraction], components: []});

                obj['color'] = color;
                obj['colorName'] = getColorName(color);

                client.interactionActions.set(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`, obj);

                const getTicketCategory = new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setCustomId(`ticket-category-parent`)
                .setLabel(`The name or id of the parent`)
                .setPlaceholder(`Name or id`)
                .setMaxLength(100)
                .setMinLength(1)
                .setRequired(true);
                const ticketCategoryModal = new ModalBuilder()
                .setCustomId(`ticket-category-parent-modal`)
                .setComponents(new ActionRowBuilder().addComponents(getTicketCategory))
                .setTitle(`Ticket category channel`);

                interaction.showModal(ticketCategoryModal).catch(err => {});
                break;
        }
    }
}
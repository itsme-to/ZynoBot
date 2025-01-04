const { EmbedBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'ticket-category-confirm-emote',
        description: 'When the role gets confirmed for the ticket category'
    },
    run: async function(client, interaction){
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        
        const ticketCategoryInfo = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);
        if(!ticketCategoryInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const customDescription = new TextInputBuilder()
        .setCustomId('description')
        .setLabel('Custom message ticket category')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(500)
        .setStyle(TextInputStyle.Paragraph);

        const customDescriptionModal = new ModalBuilder()
        .setCustomId('custom-ticket-category-description')
        .setTitle('Custom message')
        .setComponents(new ActionRowBuilder().addComponents(customDescription));

        interaction.showModal(customDescriptionModal).catch(err => {});
    }
}
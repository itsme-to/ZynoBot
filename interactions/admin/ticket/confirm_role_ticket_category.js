const { EmbedBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'confirm-ticket-category-role',
        description: 'When the role gets confirmed for the ticket category'
    },
    run: async function(client, interaction){
        const roleId = interaction.customId.split('__')[1];

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        
        const ticketCategoryInfo = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);
        if(!ticketCategoryInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        client.interactionActions.set(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`, {...ticketCategoryInfo, role: roleId});

        const customDescription = new TextInputBuilder()
        .setCustomId('emoji')
        .setLabel('An emoji to add to the ticket category')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(10)
        .setStyle(TextInputStyle.Short);

        const customDescriptionModal = new ModalBuilder()
        .setCustomId('ticket-category-add-emoji')
        .setTitle('Custom emoji')
        .setComponents(new ActionRowBuilder().addComponents(customDescription));

        interaction.showModal(customDescriptionModal).catch(err => {});
    }
}
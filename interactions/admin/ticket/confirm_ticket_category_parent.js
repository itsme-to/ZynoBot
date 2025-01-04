const { TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'confirm-ticket-category-parent',
        description: 'When the parent of the ticket category gets confirmed'
    },
    run: function(client, interaction){
        const ticketCategory = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!ticketCategory) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const categoryAccess = new TextInputBuilder()
        .setMaxLength(100)
        .setMinLength(1)
        .setRequired(false)
        .setPlaceholder('No role mentioned')
        .setLabel('The role\'s name or id which should get access')
        .setStyle(TextInputStyle.Short)
        .setCustomId('role-access');

        const accessModal = new ModalBuilder()
        .setTitle('Access to tickets')
        .setCustomId('ticket-category-role-access')
        .setComponents(new ActionRowBuilder().addComponents(categoryAccess));

        interaction.showModal(accessModal).catch(err => {});
    }
}
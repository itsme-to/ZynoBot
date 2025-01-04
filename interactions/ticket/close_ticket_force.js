const { TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'close-ticket-force',
        description: 'When the user deletes the ticket'
    },
    async run(client, interaction) {
        // Create the modal components
        const reasonInput = new TextInputBuilder()
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setMinLength(1)
            .setRequired(false)
            .setCustomId('reason')
            .setLabel('Reason to close ticket')
            .setPlaceholder('No reason provided');

        // Create the action row and add the input
        const inputActionRow = new ActionRowBuilder().addComponents(reasonInput);

        // Create and show the modal
        const reasonModal = new ModalBuilder()
            .setTitle('Close ticket')
            .setCustomId('delete-ticket-modal')
            .addComponents(inputActionRow);

        try {
            await interaction.showModal(reasonModal);
        } catch (err) {
            console.error('Error showing modal:', err);
            await interaction.reply({ 
                content: 'There was an error while showing the close ticket modal. Please try again.',
                ephemeral: true 
            }).catch(() => {});
        }
    }
} 
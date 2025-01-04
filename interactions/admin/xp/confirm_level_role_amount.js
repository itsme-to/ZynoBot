const { TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-level-role-amount',
        description: 'When the level amount of the level role gets confirmed'
    },
    run: function(client, interaction){
        const roleInput = new TextInputBuilder()
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('No input given')
        .setMinLength(1)
        .setMaxLength(100)
        .setRequired(true)
        .setLabel('Role name or id')
        .setCustomId('level-role');

        const roleInputActionRow = new ActionRowBuilder().addComponents(roleInput);
        const levelRoleModal = new ModalBuilder()
        .setComponents(roleInputActionRow)
        .setTitle('The role to give')
        .setCustomId('level-role-level-role');

        interaction.showModal(levelRoleModal).catch(err => {});
    }
}
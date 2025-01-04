const { TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'verify-user',
        description: 'When a user wants to verify themselve'
    },
    run: function(client, interaction){
        let verifyArr = client.deepCopy(client.unverified.get(interaction.user.id) || []);
        let verifyInfo = verifyArr.filter(u => u.messageId === interaction.message.id);
        if(verifyInfo.length === 0) return interaction.deferUpdate().catch(err => {});

        const textInput = new TextInputBuilder()
        .setCustomId('code')
        .setLabel('Verification code')
        .setMinLength(1)
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('No code provided');

        const verificationModal = new ModalBuilder()
        .setCustomId('verify-code')
        .setTitle('User verification')
        .setComponents(new ActionRowBuilder().addComponents(textInput));

        interaction.showModal(verificationModal).catch(console.log);
    }
}
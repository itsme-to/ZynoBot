const { EmbedBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'select-xp-action',
        description: 'Which action needs to be executed'
    },
    run: function(client, interaction){
        const xpMember = client.interactionActions.get(`xp-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!xpMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const action = interaction.values[0].toLowerCase();

        const actionRow = new ActionRowBuilder();

        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change <@!${xpMember.id}>'s xp has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'remove':
                const removeModal = new ModalBuilder()
                .setCustomId(`remove-xp-balance`);
                removeModal.setTitle(`The amount to remove`);
                const removeInput = new TextInputBuilder()
                .setCustomId(`remove-amount`)
                .setLabel(`The amount of xp to remove`)
                .setPlaceholder(`No amount provided`)
                .setMinLength(1)
                .setMaxLength(50)
                .setRequired(true)
                .setStyle(TextInputStyle.Short);
                actionRow.addComponents(removeInput);
                removeModal.addComponents(actionRow);

                interaction.showModal(removeModal).catch(err => {});
                break;
            case 'add':
                const addModal = new ModalBuilder()
                .setCustomId(`add-xp-balance`);
                addModal.setTitle(`The amount to add`);
                const addInput = new TextInputBuilder()
                .setCustomId(`add-amount`)
                .setLabel(`The amount of xp to add`)
                .setPlaceholder(`No amount provided`)
                .setMinLength(1)
                .setMaxLength(50)
                .setRequired(true)
                .setStyle(TextInputStyle.Short);
                actionRow.addComponents(addInput);
                addModal.addComponents(actionRow);

                interaction.showModal(addModal).catch(err => {});
                break;
        }
    }
}
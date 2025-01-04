const { EmbedBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ModalBuilder  } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-level-member',
        description: 'When the level member gets confirmed'
    },
    run: function(client, interaction){
        const levelMember = client.interactionActions.get(`level-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!levelMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const levelInput = new TextInputBuilder()
        .setCustomId('level-input')
        .setPlaceholder('No level provided')
        .setLabel('New level')
        .setMaxLength(2)
        .setMinLength(1)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
        const levelInputActionRow = new ActionRowBuilder().addComponents(levelInput);
        const levelModal = new ModalBuilder()
        .setCustomId('select-level-input')
        .setTitle('The member\'s new level')
        .setComponents(levelInputActionRow);

        interaction.showModal(levelModal).catch(console.log);
    }
}
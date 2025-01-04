const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: {
        id: 'level-amount-level-role',
        description: 'When the level which is required to get the level role has been provided'
    },
    run: function(client, interaction){
        const levelAmount = interaction.fields.getTextInputValue('level-amount');

        if(!/^[0-9]{1,3}$/.test(levelAmount)){
            const invalidLevel = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Invalid number`)
            .setDescription(`The level amount must be a number with a max of 999`)
            .setTimestamp();

            return interaction.update({embeds: [invalidLevel], components: []}).catch(err => {});
        } else {
            client.interactionActions.set(`level-role-${interaction.member.id}-${interaction.guild.id}`, {level: parseInt(levelAmount)});

            const confirmAmount = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle('Confirm the level amount')
            .setDescription('Please confirm that members would need to reach level '+levelAmount+' to get this role.')
            .setTimestamp();

            const confirmBtn = new ButtonBuilder()
            .setCustomId('confirm-level-role-amount')
            .setStyle(ButtonStyle.Success)
            .setLabel('Confirm');
            const cancelBtn = new ButtonBuilder()
            .setCustomId('cancel-level-role-amount')
            .setStyle(ButtonStyle.Danger)
            .setLabel('Cancel');

            const confirmActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

            interaction.update({embeds: [confirmAmount], components: [confirmActionRow]}).catch(err => {});
        }
    }
}
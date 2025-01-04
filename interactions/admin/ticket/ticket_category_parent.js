const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'confirm-ticket-category-parent-2',
        description: 'When the parent of the ticket category gets confirmed'
    },
    run: function(client, interaction){
        const obj = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!obj) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const confirmEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Confirm your action`)
        .setDescription(`Are you sure that you want to add the ticket category `+"`"+obj.name+"`"+` with the ${obj.colorName.toLowerCase()} color with the parent `+"`"+obj.parentName+"`"+`?`)
        .setTimestamp();

        const confirmBtn = new ButtonBuilder()
        .setCustomId(`confirm-add-category-parent`)
        .setLabel(`Confirm`)
        .setStyle(ButtonStyle.Success);
        const cancelBtn = new ButtonBuilder()
        .setCustomId(`cancel-add-category-parent`)
        .setLabel(`Cancel`)
        .setStyle(ButtonStyle.Danger);

        const confirmActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

        interaction.update({embeds: [confirmEmbed], components: [confirmActionRow]}).catch(err => {});
    }
}
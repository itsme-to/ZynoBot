const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'select-remove-anti-filter',
        description: 'When a channel gets selected to be removed from the anti filter channels'
    },
    run: function(client, interaction){
        const channelId = interaction.values[0].toLowerCase();

        switch(channelId){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to remove an anti-filter channel has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            default:
                const confirmEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Confirm your action`)
                .setDescription(`Are you sure that you want to remove <#${channelId}> from the anti-filter channels`)
                .setTimestamp();

                const confirmBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId(`confirm-remove-anti-filter-channel`)
                .setLabel(`Confirm`);
                const cancelBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`cancel-remove-anti-filter-channel`)
                .setLabel(`Cancel`);

                const confirmActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

                client.interactionActions.set(`remove-anti-filter-channel-${interaction.member.id}-${interaction.guild.id}`, channelId);

                interaction.update({embeds: [confirmEmbed], components: [confirmActionRow]}).catch(err => {});
                break;
        }
    }
}
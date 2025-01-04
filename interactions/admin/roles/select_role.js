const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'role-select-admin',
        description: 'When the role gets provided'
    },
    run: function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        switch(type){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change a role has been cancelled`)
                .setTimestamp();
                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            default:
                client.interactionActions.set(`change-special-role-${interaction.member.id}-${interaction.guild.id}`, {type: type});

                const selectAction = new StringSelectMenuBuilder()
                .setCustomId('select-action-special-role')
                .setPlaceholder('No action selected')
                .setOptions([{
                    label: 'Add',
                    value: 'add',
                    description: 'Add a special role'
                }, {
                    label: 'Remove',
                    value: 'remove',
                    description: 'Remove an existing special role'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const selectActionRow = new ActionRowBuilder().addComponents(selectAction);

                const actionEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Select an action')
                .setDescription('Select an action to perform the action.')
                .setTimestamp();

                interaction.update({embeds: [actionEmbed], components: [selectActionRow]}).catch(err => {});
                break;
        }
    }
}
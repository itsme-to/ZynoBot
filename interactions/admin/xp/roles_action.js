const { EmbedBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'change-level-roles',
        description: 'When the level roles should be changed'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the level roles has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'remove':
                const rolesRemove = client.deepCopy((client.globals.get('level-roles') || {}))[interaction.guild.id] || {};
                if(Object.keys(rolesRemove).length === 0){
                    const noLevelRoles = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`No level roles`)
                    .setDescription(`No level roles have been set for this server.`)
                    .setTimestamp();

                    interaction.update({embeds: [noLevelRoles], components: []}).catch(err => {});
                } else {
                    const selectRemoveRole = new StringSelectMenuBuilder()
                    .setCustomId('remove-level-role')
                    .setPlaceholder('No role selected')
                    .setOptions([...Object.keys(rolesRemove).map(r => {
                        return {
                            label: 'Level '+r,
                            description: 'Remove the level '+r+'role',
                            value: r.toString()
                        };
                    }), {
                        label: 'Cancel',
                        value: 'cancel',
                        description: 'Cancel this action'
                    }]);

                    const removeActionRow = new ActionRowBuilder().addComponents(selectRemoveRole);

                    const selectRemoveRoleEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Select a role`)
                    .setDescription(`Select one of the level roles in the menu below to remove it.`)
                    .setTimestamp();

                    interaction.update({embeds: [selectRemoveRoleEmbed], components: [removeActionRow]}).catch(err => {});
                }
                break;
            case 'add':
                const rolesAdd = (client.globals.get('level-roles') || {})[interaction.guild.id] || {};
                if(Object.keys(rolesAdd).length >= 10){
                    const noLevelRoles = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Max reached`)
                    .setDescription(`You have reached the maximum amount of level roles of 10.`)
                    .setTimestamp();

                    interaction.update({embeds: [noLevelRoles], components: []}).catch(err => {});
                } else {
                    const levelAmountInput = new TextInputBuilder()
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('No input given')
                    .setMinLength(1)
                    .setMaxLength(3)
                    .setRequired(true)
                    .setLabel('The required level')
                    .setCustomId('level-amount');

                    const levelAmountActionRow = new ActionRowBuilder().addComponents(levelAmountInput);
                    const levelAmountModal = new ModalBuilder()
                    .setComponents(levelAmountActionRow)
                    .setTitle('The level required for the role')
                    .setCustomId('level-amount-level-role');

                    interaction.showModal(levelAmountModal).catch(err => {});
                }
                break;
        }
    }
}
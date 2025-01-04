const { EmbedBuilder, TextInputBuilder, ModalBuilder, ActionRowBuilder, TextInputStyle, StringSelectMenuBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'select-action-special-role',
        description: 'When the role gets provided'
    },
    run: async function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        let type = client.interactionActions.get(`change-special-role-${interaction.member.id}-${interaction.guild.id}`);
        if(!type) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        type = type.type;

        switch(action){
            case 'add':
                const roleModal = new ModalBuilder()
                .setCustomId(`role-modal`);
            	const roleInput = new TextInputBuilder()
                .setCustomId(`role-input`)
                .setLabel(`The role name or id`)
                .setRequired(true)
                .setPlaceholder(`No input given`)
                .setMinLength(1)
                .setMaxLength(100)
                .setStyle(TextInputStyle.Short);
                const roleActionRow = new ActionRowBuilder().addComponents(roleInput);
                roleModal.setComponents(roleActionRow);

                switch(type){
                    case 'join':
                        roleModal.setTitle(`Join role`);
                        break;
                    case 'moderator':
                        roleModal.setTitle(`Moderator role`);
                        break;
                    case 'ticket':
                        roleModal.setTitle(`Ticket role`);
                        break;
                    case 'anti-filter':
                        roleModal.setTitle(`Anti-filter role`);
                        break;
                }

                interaction.showModal(roleModal).catch(console.log);
                break;
            case 'remove':
                let roles = [];
                switch(type){
                    case 'join':
                        roles = client.config.joinRoles[interaction.guild.id] || [];
                        break;
                    case 'ticket':
                        roles = client.config.tickets.roles[interaction.guild.id] || [];
                        break;
                    case 'moderator':
                        roles = client.config.moderator_roles[interaction.guild.id] || [];
                        break;
                    case 'anti-filter':
                        let antiFilterRoles = client.deepCopy((client.globals.get(`anti-filter-roles`) || {}));
                        roles = antiFilterRoles[interaction.guild.id] || [];
                        break;
                }

                const selectRemoveRoleEmbed = new EmbedBuilder()
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTimestamp();
                
                if(roles.length === 0){
                    client.interactionActions.delete(`change-special-role-${interaction.member.id}-${interaction.guild.id}`);

                    selectRemoveRoleEmbed.setColor(`Red`);
                    selectRemoveRoleEmbed.setTitle(`No roles set`);
                    selectRemoveRoleEmbed.setDescription(`There have no roles been set for this special role type and therefore can no roles be removed.`);
                    return interaction.update({embeds: [selectRemoveRoleEmbed], components: []}).catch(err => {});
                }
                selectRemoveRoleEmbed.setColor(client.embedColor);
                selectRemoveRoleEmbed.setTitle(`Select a role`);
                selectRemoveRoleEmbed.setDescription(`Select a role to remove as a special role.`);

                const selectRole = new StringSelectMenuBuilder()
                .setCustomId(`select-remove-special-role`)
                .setPlaceholder(`No role selected`);

                let selectArray = [];

                for(let i = 0; i < roles.length; i++){
                    let role = roles[i];
                    if(selectArray.filter(a => a.value === role).length > 0) continue;
                    let roleName = interaction.guild.roles.cache.get(role) || {};
                    selectArray.push({
                        label: roleName.name || 'Unknown role',
                        value: role,
                        description: 'Remove '+(roleName.name || 'Unknown role')+' as a special role'
                    });
                }
                
                selectArray.push({
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                });

                selectRole.setOptions(selectArray);

                const selectActionRow = new ActionRowBuilder().addComponents(selectRole);

                interaction.update({embeds: [selectRemoveRoleEmbed], components: [selectActionRow]}).catch(err => {});
                break;
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change a role has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
        }
    }
}
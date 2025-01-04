const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: {
        id: 'role-modal',
        description: 'When a role needs to be added or removed'
    },
    run: function(client, interaction){
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        const roleInfo = client.interactionActions.get(`change-special-role-${interaction.member.id}-${interaction.guild.id}`);

        if(!roleInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const roleInput = interaction.fields.getTextInputValue(`role-input`);

        new Promise(async (resolve, reject) => {
            const regEx = /^[0-9]*$/;
            if(regEx.test(roleInput)){
                try {
                    const channel = await client.cache.getRole(roleInput, interaction.guild);
                    resolve(channel);
                } catch {
                    reject();
                }
            } else {
                const role = interaction.guild.roles.cache.filter(role => role.name.toLowerCase() === roleInput.toLowerCase());
                if(role.size > 0){
                    resolve(role.first());
                } else {
                    const findRole = interaction.guild.roles.cache.filter(role => role.name.toLowerCase().includes(roleInput.toLowerCase()));
                    if(findRole.size > 0){
                        resolve(findRole.first());
                    } else {
                        const findRole2 = interaction.guild.roles.cache.filter(role => roleInput.toLowerCase().includes(role.name.toLowerCase()));
                        if(findRole2.size > 0){
                            resolve(findRole2.first());
                        } else {
                            reject();
                        }
                    }
                }
            }
        }).then(role => {
            const roleAdded = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Role already added`)
            .setDescription(`The role has already been added as a ${roleInfo.type} role`)
            .setTimestamp();

            switch(roleInfo.type){
                case 'join':
                    if((client.config.joinRoles[interaction.guild.id] || []).indexOf(String(role.id)) >= 0) return interaction.update({embeds: [roleAdded], components: []}).catch(err => {});
                    break;
                case 'moderator':
                    if((client.config.moderator_roles[interaction.guild.id] || []).indexOf(String(role.id)) >= 0) return interaction.update({embeds: [roleAdded], components: []}).catch(err => {});
                    break;
                case 'ticket':
                    if((client.config.tickets.roles[interaction.guild.id] || []).indexOf(String(role.id)) >= 0) return interaction.update({embeds: [roleAdded], components: []}).catch(err => {});
                    break;
            }
            const confirmEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Confirm the role`)
            .setDescription(`Do you want to add the <@&${role.id}> role as a ${roleInfo.type} role?`)
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm-special-role`)
            .setLabel(`Confirm`)
            .setStyle(ButtonStyle.Success);
            const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-special-role`)
            .setLabel(`Cancel`)
            .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            interaction.update({embeds: [confirmEmbed], components: [actionRow]}).then(() => {
                client.interactionActions.set(`change-special-role-${interaction.member.id}-${interaction.guild.id}`, {type: roleInfo.type, role: role});
            }).catch(err => {});
        }).catch(() => {
            const noFound = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`No roles found`)
            .setDescription(`There was no role found which matches the given input`)
            .setTimestamp();

            interaction.update({embeds: [noFound], components: []}).catch(err => {});
        });
    }
}
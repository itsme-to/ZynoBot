const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'level-role-level-role',
        description: 'When the role for the level role gets parsed.'
    },
    run: function(client, interaction){
        const levelRoleInfo = client.interactionActions.get(`level-role-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!levelRoleInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const roleInput = interaction.fields.getTextInputValue(`level-role`);

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
            const confirmEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Confirm the role`)
            .setDescription(`Do you want to add the role <@&${role.id}> role as the level role?`)
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm-level-role`)
            .setLabel(`Confirm`)
            .setStyle(ButtonStyle.Success);
            const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-level-role`)
            .setLabel(`Cancel`)
            .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            interaction.update({embeds: [confirmEmbed], components: [actionRow]}).then(() => {
                client.interactionActions.set(`level-role-${interaction.member.id}-${interaction.guild.id}`, {role: role.id, ...levelRoleInfo});
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
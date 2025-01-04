const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'new-shop-item-role-reward',
        description: 'When the member provides the role to add as a reward for the item'
    },
    run: function(client, interaction){
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        const interactionInfo = client.interactionActions.get(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`);

        if(!interactionInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const roleInput = interaction.fields.getTextInputValue(`role`);

        const identifier = interaction.customId.split('__')[1];

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
            .setDescription(`Do you want to add the <@&${role.id}> role as a reward for the new item?`)
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm-role-item-reward${identifier ? `__${identifier}` : ``}`)
            .setLabel(`Confirm`)
            .setStyle(ButtonStyle.Success);
            const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-role-item-reward${identifier ? `__${identifier}` : ``}`)
            .setLabel(`Cancel`)
            .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            interaction.update({embeds: [confirmEmbed], components: [actionRow]}).then(() => {
                client.interactionActions.set(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`, {...interactionInfo, role: role.id});
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
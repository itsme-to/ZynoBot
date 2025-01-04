const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: {
        id: 'ticket-category-role-access',
        description: 'When the name or id of the role which should get access to the category has been provided'
    },
    run: function(client, interaction){
        const roleInput = interaction.fields.getTextInputValue('role-access');
        if((roleInput || '').length === 0){
            const confirmEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Confirm your choice`)
            .setDescription(`Are you sure you don't want to add a role which gets access to the ticket category?`)
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm-ticket-category-role`)
            .setLabel(`Confirm`)
            .setStyle(ButtonStyle.Success);
            const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-ticket-category-role`)
            .setLabel(`Cancel`)
            .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            interaction.update({embeds: [confirmEmbed], components: [actionRow]}).catch(err => {});
            return;
        }

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
            .setDescription(`Do you want to give the role <@&${role.id}> access to this ticket category?`)
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm-ticket-category-role__${role.id}`)
            .setLabel(`Confirm`)
            .setStyle(ButtonStyle.Success);
            const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-ticket-category-role__${role.id}`)
            .setLabel(`Cancel`)
            .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            interaction.update({embeds: [confirmEmbed], components: [actionRow]}).catch(err => {});
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
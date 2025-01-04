const { EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js');

module.exports = {
    data: {
        id: 'ticket-category-parent-modal',
        description: 'When the name or id of the parent for the ticket categories has been sent'
    },
    run: function(client, interaction){
        const obj = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);
        if(!obj) return;
        const channelInput = interaction.fields.getTextInputValue('ticket-category-parent');
        
        new Promise(async (resolve, reject) => {
            const regEx = /^[0-9]*$/;
            if(regEx.test(channelInput)){
                try {
                    const channel = await client.cache.getChannel(channelInput, interaction.guild);
                    if(channel.type === ChannelType.GuildCategory) resolve(channel);
                    else reject();
                } catch {
                    reject();
                }
            } else {
                const channel = interaction.guild.channels.cache.filter(ch => ch.name.toLowerCase() === channelInput.toLowerCase() && ch.type === ChannelType.GuildCategory);
                if(channel.size > 0){
                    resolve(channel.first());
                } else {
                    const findChannel = interaction.guild.channels.cache.filter(ch => ch.name.toLowerCase().includes(channelInput.toLowerCase()) && ch.type === ChannelType.GuildCategory);
                    if(findChannel.size > 0){
                        resolve(findChannel.first());
                    } else {
                        const findChannel2 = interaction.guild.channels.cache.filter(ch => channelInput.toLowerCase().includes(ch.name.toLowerCase()) && ch.type === ChannelType.GuildCategory);
                        if(findChannel2.size > 0){
                            resolve(findChannel2.first());
                        } else {
                            reject();
                        }
                    }
                }
            }
        }).then(ch => {
            const confirmEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Confirm the category`)
            .setDescription(`Do you want to make ${ch.name} the category channel where the tickets of the category ${obj.name} will be placed in?`)
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm-ticket-category-parent`)
            .setLabel(`Confirm`)
            .setStyle(ButtonStyle.Success);
            const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-ticket-category-parent`)
            .setLabel(`Cancel`)
            .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            interaction.update({embeds: [confirmEmbed], components: [actionRow]}).then(() => {
                obj['parentName'] = ch.name;
                obj['parentId'] = ch.id;
                client.interactionActions.set(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`, obj);
            }).catch(err => {});
        }).catch(() => {
            const noFound = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`No category found`)
            .setDescription(`There was no category found which matches the given input`)
            .setTimestamp();

            interaction.update({embeds: [noFound], components: []}).catch(err => {});
        });
    }
}
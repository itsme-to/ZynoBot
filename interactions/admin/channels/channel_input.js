const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require("discord.js");

module.exports = {
    data: {
        id: 'channel-modal',
        description: 'Select the channel to enable the channel'
    },
    run: function(client, interaction){
        const channelType = interaction.customId.split('__')[1];
        const channelInput = interaction.fields.getTextInputValue(`${channelType}-channel-input`);
        
        new Promise(async (resolve, reject) => {
            const regEx = /^[0-9]*$/;
            if(regEx.test(channelInput)){
                try {
                    const channel = await client.cache.getChannel(channelInput, interaction.guild);
                    if(channel.type === ChannelType.GuildText) resolve(channel);
                    else reject();
                } catch {
                    reject();
                }
            } else {
                const channel = interaction.guild.channels.cache.filter(ch => ch.name === channelInput && ch.type === ChannelType.GuildText);
                if(channel.size > 0){
                    resolve(channel.first());
                } else {
                    const findChannel = interaction.guild.channels.cache.filter(ch => ch.name.includes(channelInput) && ch.type === ChannelType.GuildText);
                    if(findChannel.size > 0){
                        resolve(findChannel.first());
                    } else {
                        const findChannel2 = interaction.guild.channels.cache.filter(ch => channelInput.includes(ch.name) && ch.type === ChannelType.GuildText);
                        if(findChannel2.size > 0){
                            resolve(findChannel2.first());
                        } else {
                            reject();
                        }
                    }
                }
            }
        }).then(ch => {
            let channelTypeName = channelType.split('-').join(' ');
            const confirmEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Confirm the channel`)
            .setDescription(`Do you want to make <#${ch.id}> the channel for the ${channelTypeName}?`)
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm-channel__${channelType}`)
            .setLabel(`Confirm`)
            .setStyle(ButtonStyle.Success);
            const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-channel__${channelType}`)
            .setLabel(`Cancel`)
            .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            interaction.update({embeds: [confirmEmbed], components: [actionRow]}).then(() => {
                client.interactionActions.set(`${channelType}-channel-${interaction.member.id}-${interaction.guild.id}`, ch);
            }).catch(err => {});
        }).catch(() => {
            const noFound = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`No channel found`)
            .setDescription(`There was no channel found which matches the given input`)
            .setTimestamp();

            interaction.update({embeds: [noFound], components: []}).catch(err => {});
        });
    }
}
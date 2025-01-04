const { EmbedBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'filter-channel-action',
        description: 'When an action needs to be executed for the anti-filter option'
    },
    run: async function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        const antiFilterChannels = client.deepCopy((client.globals.get(`anti-filter`) || []));

        switch(type){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change an anti-filter channel has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'add':
                if(antiFilterChannels.filter(a => a.guild === interaction.guild.id).length >= 10){
                    const maxChannels = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Max channels reached`)
                    .setDescription(`You've reached the max anti-filter channels of 10, remove one to add a new one`)
                    .setTimestamp();

                    interaction.update({embeds: [maxChannels], components: []}).catch(err => {});
                } else {
                    const selectChannelInput = new TextInputBuilder()
                    .setCustomId(`anti-filter-channel-input`)
                    .setLabel(`Channel name or id`)
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);
                    const channelComponent = new ActionRowBuilder().addComponents(selectChannelInput);
                    const selectModal = new ModalBuilder()
                    .setCustomId(`anti-filter-modal-add`)
                    .setTitle(`The channel to add`)
                    .addComponents(channelComponent);

                    interaction.showModal(selectModal).catch(console.log);
                }
                break;
            case 'remove':
                if(antiFilterChannels.filter(a => a.guild === interaction.guild.id).length === 0){
                    const noChannelsEmbed = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`No anti-filter channels`)
                    .setDescription(`There have no anti-filter channels been set`)
                    .setTimestamp();

                    return interaction.update({embeds: [noChannelsEmbed], components: []}).catch(err => {});
                }

                (async () => {
                    const guildAntiFilter = antiFilterChannels.filter(a => a.guild === interaction.guild.id);
                    const removeOptions = [];
                    for(var i = 0; i < guildAntiFilter.length; i++){
                        const channelId = guildAntiFilter[i].channel;
                        var channel = {name: 'Unknown channel', id: channelId};
                        try{
                            channel = await client.cache.getChannel(channelId, interaction.guild);
                        } catch {};
                        removeOptions.push({
                            label: channel.name,
                            value: String(channel.id),
                            description: `Remove ${channel.name.slice(0, 63)} from the anti-filter channels`
                        });
                    }

                    removeOptions.push({
                        label: 'Cancel',
                        value: 'cancel',
                        description: 'Cancel this action'
                    });
    
                    const removeSelect = new StringSelectMenuBuilder()
                    .setCustomId(`select-remove-anti-filter`)
                    .setPlaceholder(`No channel selected`)
                    .setOptions(removeOptions);
    
                    const removeActionRow = new ActionRowBuilder().addComponents(removeSelect);
    
                    const removeEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Select a channel`)
                    .setDescription(`Select a channel to remove it from the anti filter channels`)
                    .setTimestamp();
    
                    interaction.update({embeds: [removeEmbed], components: [removeActionRow]}).catch(err => {});
                })();
                break;
        }
    }
}
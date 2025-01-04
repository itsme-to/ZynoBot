const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-add-anti-filter-channel',
        description: 'When the channel has been confirmed to add to the anti-filter channels'
    },
    run: async function(client, interaction){
        const channel = client.interactionActions.get(`add-anti-filter-channel-${interaction.member.id}-${interaction.guild.id}`);
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        if(!channel) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const antiFilterChannels = client.globals.get(`anti-filter`) || [];
        const filter = antiFilterChannels.filter(a => a.channel === channel.id && a.guild === interaction.guild.id);
        if(filter.length > 0){
            const alreadyAdded = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Channel already added`)
            .setDescription(`The channel <#${channel.id}> has already been added to the anti-filter channels`)
            .setTimestamp();

            return interaction.update({embeds: [alreadyAdded], components: []}).catch(err => {});
        } else if(antiFilterChannels.length >= 10){
            const maxChannels = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Max channels reached`)
            .setDescription(`You've reached the max anti-filter channels of 10, remove one to add a new one`)
            .setTimestamp();

            return interaction.update({embeds: [maxChannels], components: []}).catch(err => {});
        }
        antiFilterChannels.push({channel: channel.id, guild: interaction.guild.id});
        client.globals.set(`anti-filter`, antiFilterChannels);
        client.interactionActions.delete(`add-anti-filter-channel-${interaction.member.id}-${interaction.guild.id}`);
        try{
            await client.globals.save(`globals`);
        } catch {}

        const confirmed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Anti-filter channel saved`)
        .setDescription(`The new anti-filter channel (<#${channel.id}>) has been saved`)
        .setTimestamp();

        interaction.update({embeds: [confirmed], components: []}).catch(err => {});
    }
}
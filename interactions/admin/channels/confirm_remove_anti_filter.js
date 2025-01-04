const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-remove-anti-filter-channel',
        description: 'When the channel has been confirmed to remove from the anti-filter channels'
    },
    run: async function(client, interaction){
        const channel = client.interactionActions.get(`remove-anti-filter-channel-${interaction.member.id}-${interaction.guild.id}`);
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        if(!channel) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const antiFilterChannels = client.globals.get(`anti-filter`) || [];
        const filter = antiFilterChannels.filter(a => a.channel === channel && a.guild === interaction.guild.id);
        const i = antiFilterChannels.indexOf(filter[0]);
        if(i >= 0) antiFilterChannels.splice(i , 1);
        client.globals.set(`anti-filter`, antiFilterChannels);
        client.interactionActions.delete(`remove-anti-filter-channel-${interaction.member.id}-${interaction.guild.id}`);
        try{
            await client.globals.save(`globals`);
        } catch {}

        const confirmed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Anti-filter channel removed`)
        .setDescription(`The anti-filter channel (<#${channel}>) has been removed`)
        .setTimestamp();

        interaction.update({embeds: [confirmed], components: []}).catch(console.log);
    }
}
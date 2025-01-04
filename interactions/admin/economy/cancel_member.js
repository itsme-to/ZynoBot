const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-economy-member',
        description: 'When the action gets cancelled'
    },
    run: function(client, interaction){
        const economyMember = client.interactionActions.get(`economy-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!economyMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to change <@!${economyMember.id}>'s economy balance has been cancelled`)
        .setTimestamp();

        client.interactionActions.delete(`economy-member-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}
const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-special-role',
        description: 'When the role has been cancelled'
    },
    run: function(client, interaction){
        const role = client.interactionActions.get(`change-special-role-${interaction.member.id}-${interaction.guild.id}`);
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        if(!role) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Cancelled action`)
        .setDescription(`The action to remove the ${role.type} role (<@&${role.role.id}>) has been cancelled`)
        .setTimestamp();
        
        client.interactionActions.delete(`change-special-role-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}
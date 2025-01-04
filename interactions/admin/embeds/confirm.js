const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'confirm-color-code',
        description: 'Once the new embed color gets confirmed'
    },
    run: function(client, interaction){
        const colorCode = client.interactionActions.get(`change-color-code-${interaction.member.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!colorCode) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        client.interactionActions.delete(`change-color-code-${interaction.member.id}`);

        client.config.embeds.color = colorCode;
        client.embedColor = colorCode;
        configHandler(client, client.config);

        const confirmEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Color code changed`)
        .setDescription(`The color code has successfully been changed to `+"`"+colorCode+"`")
        .setTimestamp();

        interaction.update({embeds: [confirmEmbed], components: []}).catch(err => {});
    }
}
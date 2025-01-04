const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-back-up',
        description: 'When the user cancels the creation of a back-up'
    },
    run: function(client, interaction){
        const cancelEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to create a back-up of Zyno Bot has been cancelled`)
        .setTimestamp();

        return interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
    }
}
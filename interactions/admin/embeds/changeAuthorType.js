const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'change-author-embed-type',
        description: 'Once the new embed author type gets selected'
    },
    run: function(client, interaction){
        const authorType = interaction.values[0].toLowerCase();

        switch(authorType){
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the embed author type has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            default:
                client.config.embeds.author = authorType.toUpperCase();
                configHandler(client, client.config);

                const confirmEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Embed author type changed`)
                .setDescription(`The embed author type has successfully been changed to `+"`"+authorType+"`")
                .setTimestamp();

                interaction.update({embeds: [confirmEmbed], components: []}).catch(err => {});
                break;
        }
    }
}
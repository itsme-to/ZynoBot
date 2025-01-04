const { EmbedBuilder } = require('discord.js');
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'welcome-message-change-type',
        description: 'When the welcome message type gets changed'
    },
    run: function(client, interaction){
        const val = interaction.values[0].toUpperCase();

        switch(val){
            case 'CANCEL':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the welcome message has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            default:
                client.config.welcome[interaction.guild.id].type = val;
                configHandler(client, client.config);

                const changedType = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Welcome message changed`)
                .setDescription(`The welcome message has successfully been changed to ${val.toLowerCase()}!`)
                .setTimestamp();

                interaction.update({embeds: [changedType], components: []}).catch(err => {});
                break;
        }
    }
}
const { EmbedBuilder } = require('discord.js');
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'leave-message-change-type',
        description: 'When the leave message type gets changed'
    },
    run: function(client, interaction){
        const val = interaction.values[0].toUpperCase();

        switch(val){
            case 'CANCEL':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the leave message has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            default:
                client.config.leave[interaction.guild.id].type = val;
                configHandler(client, client.config);

                const changedType = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Leave message changed`)
                .setDescription(`The leave message has successfully been changed to ${val.toLowerCase()}!`)
                .setTimestamp();

                interaction.update({embeds: [changedType], components: []}).catch(err => {});
                break;
        }
    }
}
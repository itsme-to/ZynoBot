const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'select-auto-tag-option',
        description: 'When a member provides how it would like to configure the auto tag feature'
    },
    run: function(client, interaction){
        const value = interaction.values[0].toLowerCase();

        switch(value){
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the auto tag feature has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            case 'disable':
                client.config.tickets['auto-tag'][interaction.guild.id] = false;
                configHandler(client, client.config);

                const disabled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Auto tag disabled`)
                .setDescription(`The auto tag feature has successfully been disabled`)
                .setTimestamp();

                interaction.update({embeds: [disabled], components: []}).catch(err => {});
                break;
            default:
                client.config.tickets['auto-tag'][interaction.guild.id] = value.toUpperCase();
                configHandler(client, client.config);

                const changed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Auto tag changed`)
                .setDescription(`The auto tag feature has successfully been enabled`)
                .setTimestamp();

                interaction.update({embeds: [changed], components: []}).catch(err => {});
                break;
        }
    }
}
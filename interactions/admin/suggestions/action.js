const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'change-suggestion-settings',
        description: 'When a member decides to change the suggestion settings'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the suggestion settings has been cancelled`)
                .setTimestamp();
                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'conversion':
                client.config.suggestion[interaction.guild.id].conversion = !client.config.suggestion[interaction.guild.id].conversion;
                configHandler(client, client.config);

                const conversionChanged = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                .setTitle(`Suggestion conversion ${client.config.suggestion[interaction.guild.id].conversion ? 'enabled' : 'disabled'}`)
                .setDescription(`Messages which are being send in the suggestion channel ${client.config.suggestion[interaction.guild.id].conversion ? 'will now be' : 'will not be'} converted to suggestions`)
                .setTimestamp();

                interaction.update({embeds: [conversionChanged], components: []}).catch(err => {});
                break;
            case 'autothread':
                client.config.suggestion[interaction.guild.id].autoThread = !client.config.suggestion[interaction.guild.id].autoThread;
                configHandler(client, client.config);

                const autothreadChanged = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                .setTitle(`Autothread has been ${client.config.suggestion[interaction.guild.id].autoThread ? 'enabled' : 'disabled'}`)
                .setDescription(`The bot will ${client.config.suggestion[interaction.guild.id].autoThread ? `now automatically start` : `now stop starting`} threads for each new suggestion made`)
                .setTimestamp();

                interaction.update({embeds: [autothreadChanged], components: []}).catch(err => {});
                break;
        }
    }
}
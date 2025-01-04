const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'help-select-action',
        description: 'When the user selects an action for the help command'
    },
    run: function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        switch(type){
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the help embed has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            case 'tag':
                client.config.helpEmbedOnTag = !client.config.helpEmbedOnTag;
                configHandler(client, client.config);

                const tagChanged = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Changed tag action`)
                .setDescription(`The bot will from now of on ${client.config.helpEmbedOnTag === false ? `not ` : ``}respond with the help embed when the bot gets tagged`)
                .setTimestamp();

                interaction.update({embeds: [tagChanged], components: []}).catch(err => {});
                break;
            case 'full':
                client.config.helpEmbedFull = !client.config.helpEmbedFull;
                configHandler(client, client.config);

                const fullChanged = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Changed help embed`)
                .setDescription(`The bot will from now of on ${client.config.helpEmbedFull === false ? `not ` : ``}respond with the full help embed`)
                .setTimestamp();

                interaction.update({embeds: [fullChanged], components: []}).catch(err => {});
                break;
        }
    }
}
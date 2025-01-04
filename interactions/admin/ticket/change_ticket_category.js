const { EmbedBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'ticket-category-type-change',
        description: 'When the ticket category gets changed'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the ticket category type has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            default:
                client.config.tickets.categoryType[interaction.guild.id] = action.toUpperCase();
                configHandler(client, client.config);

                const changed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Category type changed`)
                .setDescription(`The category type has successfully been changed to `+"`"+action+"`")
                .setTimestamp();

                interaction.update({embeds: [changed], components: []}).catch(err => {});
                break;
        }
    }
}
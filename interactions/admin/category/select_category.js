const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

function firstLetterUppercase(string){
    var firstLetter = string.slice(0, 1);
    var newString = firstLetter.toUpperCase() + string.slice(1, string.length);
    return newString;
}

module.exports = {
    data: {
        id: 'select-category',
        description: 'Select a category to enable/disable it'
    },
    run: function(client, interaction){
        const category = interaction.values[0].toLowerCase();

        if(category === 'cancel'){
            const cancelEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Cancelled action`)
            .setDescription(`The action to enable/disable a category has successfully been cancelled`)
            .setTimestamp();

            return interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
        }

        var enabled = false;
        if(typeof client.config[category] === 'boolean'){
            enabled = Boolean(client.config[category]);
            client.config[category] = !enabled;
        } else if(typeof client.config[category] === 'object'){
            if(typeof client.config[category].enabled === 'boolean'){
                enabled = Boolean(client.config[category].enabled);
                client.config[category].enabled = !enabled;
            } else {
                throw new Error(`Invalid category '${category}' in config.json`);
            }
        } else {
            throw new Error(`Invalid category type of '${typeof client.config[category]}' in config.json`);
        }

        configHandler(client, client.config);

        const editedEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`${enabled === true ? `Disabled` : `Enabled`} category`)
        .setDescription(`${firstLetterUppercase(category)} has successfully been ${enabled === true ? `disabled` : `enabled`}`)
        .setTimestamp();

        interaction.update({embeds: [editedEmbed], components: []}).catch(err => {});
    }
}
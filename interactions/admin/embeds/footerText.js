const { EmbedBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'change-footer-text',
        description: 'When the new footer text has been provided'
    },
    run: function(client, interaction){
        const footerText = (interaction.fields.getTextInputValue(`footer-input`) || '');

        if(footerText.length === 0){
            client.config.embeds.footer = false;

            const textRemoved = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Footer text disabled`)
            .setDescription(`The text on the footers has successfully been disabled`)
            .setTimestamp();
    
            interaction.update({embeds: [textRemoved], components: []}).catch(err => {});
        } else {
            client.config.embeds.footer = footerText;

            const textChanged = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Footer text changed`)
            .setDescription(`The text on the footers has successfully been changed to `+"`"+footerText+"`")
            .setTimestamp();
    
            interaction.update({embeds: [textChanged], components: []}).catch(err => {});
        }
        configHandler(client, client.config);
    }
}
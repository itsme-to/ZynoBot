const { EmbedBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'vccoins-amount',
        description: 'When the voice channel coins amount gets changed'
    },
    run: function(client, interaction){
        const amount = interaction.fields.getTextInputValue('amount');

        const invalidNumber = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Invalid number`)
        .setDescription(`The amount of coins must be a number`)
        .setTimestamp();

        if(!parseInt(amount)) return interaction.update({embeds: [invalidNumber], components: []}).catch(err => {});

        client.config.economy.voice.coins = parseInt(amount);
        configHandler(client, client.config);

        const changedAmount = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Changed voice channel coins`)
        .setDescription(`The amount of coins has successfully been changed to ${amount}`)
        .setTimestamp();

        interaction.update({embeds: [changedAmount], components: []}).catch(err => {});
    }
}
const { EmbedBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'ticket-amount-change',
        description: 'When the amount of tickets should be changed'
    },
    run: function(client, interaction){
        const amount = interaction.fields.getTextInputValue(`amount`);

        const invalidNumber = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Amount is not a number`)
        .setDescription(`The provided amount of max open tickets is not a number`)
        .setTimestamp();
        
        if(parseInt(amount) === NaN) return interaction.update({embeds: [invalidNumber], components: []}).catch(err => {});

        const numberTooHigh = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Max 10 tickets`)
        .setDescription(`You can set the max tickets maximum to 10`)
        .setTimestamp();

        if(parseInt(amount) > 10) return interaction.update({embeds: [numberTooHigh], components: []}).catch(err => {});

        client.config.tickets.max[interaction.guild.id] = parseInt(amount);
        configHandler(client, client.config);

        const success = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Amount changed`)
        .setDescription(`The new max amount of tickets has been changed`)
        .setTimestamp();

        interaction.update({embeds: [success], components: []}).catch(err => {});
    }
}
const { EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'vccoins-select-admin',
        description: 'When an action gets selected to execute'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        if(['enable', 'disable'].indexOf(action) >= 0){
            client.config.economy.voice.enabled = !client.config.economy.voice.enabled;
            configHandler(client, client.config);

            const changed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`${client.config.economy.voice.enabled === true ? `Enabled` : `Disabled`} voice channel coins`)
            .setDescription(`The voice channel coins have successfully been enabled`)
            .setTimestamp();

            interaction.update({embeds: [changed], components: []}).catch(err => {});
        } else if(action === 'cancel'){
            const cancelEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Action cancelled`)
            .setDescription(`The action to change the voice channel coins has been cancelled`)
            .setTimestamp();

            interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
        } else if(action === 'amount'){
            const coinsAmount = new TextInputBuilder()
            .setCustomId(`amount`)
            .setLabel(`Amount of coins per ${client.config.economy.voice.seconds} seconds`)
            .setPlaceholder(`No amount provided`)
            .setMinLength(1)
            .setMaxLength(3)
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

            const coinsAmountActionRow = new ActionRowBuilder().addComponents(coinsAmount);

            const amountModal = new ModalBuilder()
            .setTitle(`Change voice channel coins`)
            .setCustomId(`vccoins-amount`)
            .setComponents(coinsAmountActionRow);
            
            interaction.showModal(amountModal).catch(err => {});
        } else if(action === 'time'){
            const coinsTime = new TextInputBuilder()
            .setCustomId(`time`)
            .setLabel(`Amount of seconds a user needs to speak`)
            .setPlaceholder(`No time provided`)
            .setMinLength(1)
            .setMaxLength(3)
            .setRequired(true)
            .setStyle(TextInputStyle.Short);

            const coinsTimeActionRow = new ActionRowBuilder().addComponents(coinsTime);

            const timeModal = new ModalBuilder()
            .setTitle(`Change voice channel time`)
            .setCustomId(`vccoins-time`)
            .setComponents(coinsTimeActionRow);
            
            interaction.showModal(timeModal).catch(err => {});
        }
    }
}
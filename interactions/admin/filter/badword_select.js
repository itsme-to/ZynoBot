const { EmbedBuilder, TextInputBuilder, ModalBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'badword-options-select',
        description: 'When an option gets provided for the bad word filter'
    },
    run: function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        switch(type){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to make a change to the bad word filter has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'status':
                client.config.filters.badword[interaction.guild.id] = !client.config.filters.badword[interaction.guild.id];
                configHandler(client, client.config);

                const updatedEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Bad word filter ${client.config.filters.badword === true ? `enabled` : `disabled`}`)
                .setDescription(`The bad word filter has successfully been ${client.config.filters.badword === true ? `enabled` : `disabled`}`)
                .setTimestamp();

                interaction.update({embeds: [updatedEmbed], components: []}).catch(err => {});
                break;
            case 'words':
                const badwordInput = new TextInputBuilder()
                .setMinLength(1)
                .setMaxLength(100)
                .setCustomId(`input-badword`)
                .setLabel(`No word provided`)
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

                const badwordModal = new ModalBuilder()
                .setCustomId(`change-word-badword-filter`)
                .setTitle(`Add or remove a bad word`);

                const badwordActionRow = new ActionRowBuilder().addComponents(badwordInput);

                badwordModal.addComponents(badwordActionRow);

                interaction.showModal(badwordModal);
                break;
        }
    }
}
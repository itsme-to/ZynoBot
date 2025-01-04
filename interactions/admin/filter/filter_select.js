const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'filter-select-admin',
        description: 'Once a filter gets selected and an action needs to be executed'
    },
    run: function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        switch(type){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to enable, disable or change a filter has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'invite':
                client.config.filters.invite[interaction.guild.id] = !client.config.filters.invite[interaction.guild.id];
                configHandler(client, client.config);

                const inviteFilter = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Anti-invite filter ${client.config.filters.invite[interaction.guild.id] === true ? `enabled` : `disabled`}`)
                .setDescription(`The anti-invite filter has successfully been ${client.config.filters.invite[interaction.guild.id] === true ? `enabled` : `disabled`}`)
                .setTimestamp();

                interaction.update({embeds: [inviteFilter], components: []}).catch(err => {});
                break;
            case 'links':
                client.config.filters.links[interaction.guild.id] = !client.config.filters.links[interaction.guild.id];
                configHandler(client, client.config);

                const linkFilter = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Anti-links filter ${client.config.filters.links[interaction.guild.id] === true ? `enabled` : `disabled`}`)
                .setDescription(`The anti-links filter has successfully been ${client.config.filters.links[interaction.guild.id] === true ? `enabled` : `disabled`}`)
                .setTimestamp();

                interaction.update({embeds: [linkFilter], components: []}).catch(err => {});
                break;
            case 'badword':
                const badwordOptions = new StringSelectMenuBuilder()
                .setCustomId(`badword-options-select`)
                .setPlaceholder(`No option selected`)
                .setOptions([{
                    label: `${client.config.filters.badword[interaction.guild.id] === true ? `Disable` : `Enable`}`,
                    value: 'status',
                    description: `${client.config.filters.badword[interaction.guild.id] === true ? `Disable` : `Enable`} the bad word filter`
                }, {
                    label: 'Change words',
                    value: 'words',
                    description: 'Add or remove words from the bad word filter'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const badwordEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Bad word filter`)
                .setDescription(`Please select one of the options below to make a change to the bad word filter`)
                .setTimestamp();

                const badwordActionRow = new ActionRowBuilder().addComponents(badwordOptions);

                interaction.update({embeds: [badwordEmbed], components: [badwordActionRow]}).catch(err => {});
                break;
        }
    }
}
const { EmbedBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'select-level-setting',
        description: 'When the user wants to change something from the level settings'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the level settings has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'user-xp-change':
                const userXPInput = new TextInputBuilder()
                .setCustomId(`user`)
                .setMinLength(1)
                .setMaxLength(50)
                .setStyle(TextInputStyle.Short)
                .setLabel(`Username, user tag or user id`)
                .setRequired(true)
                .setPlaceholder(`No user given`);
                const userXPModal = new ModalBuilder()
                .setCustomId(`user-select-xp`)
                .setTitle(`Get the user`)
                const userXPActionRow = new ActionRowBuilder().addComponents(userXPInput);
                userXPModal.addComponents(userXPActionRow);

                interaction.showModal(userXPModal);
                break;
            case 'user-level-change':
                const userLevelInput = new TextInputBuilder()
                .setCustomId(`user`)
                .setMinLength(1)
                .setMaxLength(50)
                .setStyle(TextInputStyle.Short)
                .setLabel(`Username, user tag or user id`)
                .setRequired(true)
                .setPlaceholder(`No user given`);
                const userLevelModal = new ModalBuilder()
                .setCustomId(`user-select-level`)
                .setTitle(`Get the user`)
                const userLevelActionRow = new ActionRowBuilder().addComponents(userLevelInput);
                userLevelModal.addComponents(userLevelActionRow);

                interaction.showModal(userLevelModal);
                break;
            case 'level-roles':
                const selectLevelRolesAction = new StringSelectMenuBuilder()
                .setCustomId('change-level-roles')
                .setPlaceholder('No action selected')
                .setOptions([{
                    label: 'Add',
                    description: `Add a level role (max 10)`,
                    value: `add`
                }, {
                    label: 'Remove',
                    description: `Remove a level role`,
                    value: `remove`
                }, {
                    label: 'Cancel',
                    description: 'Cancel this action',
                    value: `cancel`
                }]);

                const levelRolesActionRow = new ActionRowBuilder().addComponents(selectLevelRolesAction);

                const selectLevelRolesEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Select an action')
                .setDescription('Select an action in the select menu below to perform it.')
                .setTimestamp();

                interaction.update({embeds: [selectLevelRolesEmbed], components: [levelRolesActionRow]}).catch(err => {});
                break;
            case 'level-difficulty':
                const levelDifficultyOptions = new StringSelectMenuBuilder()
                .setCustomId(`change-level-difficulty`)
                .setPlaceholder(`No difficulty type selected`)
                .setOptions([{
                    label: `Exponential hard${client.config.level.difficulty[interaction.guild.id] === "EXPONENTIAL HARD" ? ` (currently enabled)` : ``}`,
                    value: 'exponential-hard',
                    description: 'The hardest way to level up with an exponential formula'
                }, {
                    label: `Exponential normal${client.config.level.difficulty[interaction.guild.id] === "EXPONENTIAL NORMAL" ? ` (currently enabled)` : ``}`,
                    value: 'exponential-normal',
                    description: 'An easier way to level up with an exponential formula'
                }, {
                    label: `Linear hard${client.config.level.difficulty[interaction.guild.id] === "LINEAR HARD" ? ` (currently enabled)` : ``}`,
                    value: 'linear-hard',
                    description: 'A harder way to level up with a linear formula'
                }, {
                    label: `Linear${client.config.level.difficulty[interaction.guild.id] === "LINEAR" || client.config.level.difficulty[interaction.guild.id] === "LINEAR NORMAL" ? ` (currently enabled)` : ``}`,
                    value: 'linear-normal',
                    description: 'The easiest way to level up with a linear formula'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this option'
                }]);

                const levelDifficultyActionRow = new ActionRowBuilder().addComponents(levelDifficultyOptions);

                const selectDifficultyEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select a difficulty`)
                .setDescription(`Select a difficulty to apply this for the level system`)
                .setTimestamp();

                interaction.update({embeds: [selectDifficultyEmbed], components: [levelDifficultyActionRow]}).catch(err => {});
                break;
            case 'level-image':
                client.config.level['canvas-type'][interaction.guild.id] = client.config.level['canvas-type'][interaction.guild.id] === "CLASSIC" ? "MODERN" : "CLASSIC";
                configHandler(client, client.config);

                const changedCanvas = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Changed level image`)
                .setDescription(`The type of the level image has now been set to ${client.config.level['canvas-type'][interaction.guild.id].toLowerCase()}.`)
                .setTimestamp();

                interaction.update({embeds: [changedCanvas], components: []}).catch(err => {});
                break;
        }
    }
}
const { EmbedBuilder, TextInputBuilder, ActionRowBuilder, ModalBuilder, TextInputStyle, StringSelectMenuBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id:'select-channel',
        description: 'Select a channel to change the type'
    },
    run: async function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        switch(type){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change a channel has been cancelled`)
                .setTimestamp();
                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'welcome-channel':
                if(['string', 'number'].includes(typeof client.config.welcome[interaction.guild.id].channel)){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Welcome message disabled`)
                    .setDescription(`The welcome messages which were supposed to be send in <#${client.config.welcome[interaction.guild.id].channel}> have been disabled`)
                    .setTimestamp();
                    client.config.welcome[interaction.guild.id].channel = false;
                    client.welcomeChannel[interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Welcome messages`)
                    .setCustomId(`channel-modal__welcome`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`welcome-channel-input`)
                    .setLabel(`The channel name or id`)
                    .setRequired(true)
                    .setPlaceholder(`No input given`)
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setStyle(TextInputStyle.Short);
                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    modal.addComponents(actionRow);
                    interaction.showModal(modal).catch(err => {});
                }
                break;
            case 'leave-channel':
                if(['string', 'number'].includes(typeof client.config.leave[interaction.guild.id].channel)){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Leave message disabled`)
                    .setDescription(`The leave messages which were supposed to be send in <#${client.config.leave[interaction.guild.id].channel}> have been disabled`)
                    .setTimestamp();
                    client.config.leave[interaction.guild.id].channel = false;
                    client.leaveChannel[interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Leave messages`)
                    .setCustomId(`channel-modal__leave`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`leave-channel-input`)
                    .setLabel(`The channel name or id`)
                    .setRequired(true)
                    .setPlaceholder(`No input given`)
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setStyle(TextInputStyle.Short);
                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    modal.addComponents(actionRow);
                    interaction.showModal(modal).catch(err => {});
                }
                break;
            case 'counting-channel':
                if(['string', 'number'].includes(typeof client.config.countingChannel[interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Counting channel disabled`)
                    .setDescription(`The counting game which was supposed to be played in <#${client.config.countingChannel[interaction.guild.id]}> has been disabled`)
                    .setTimestamp();
                    client.config.countingChannel[interaction.guild.id] = false;
                    client.countingChannel[interaction.guild.id] = undefined;
                    try{
                        await client.dbHandler.deleteValue(`globals`, 'counting');
                    } catch {}
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Counting channel`)
                    .setCustomId(`channel-modal__counting`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`counting-channel-input`)
                    .setLabel(`The channel name or id`)
                    .setRequired(true)
                    .setPlaceholder(`No input given`)
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setStyle(TextInputStyle.Short);
                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    modal.addComponents(actionRow);
                    interaction.showModal(modal).catch(err => {});
                }
                break;
            case 'snake-channel':
                if(['string', 'number'].includes(typeof client.config.snakeChannel[interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Snake channel disabled`)
                    .setDescription(`The snake game which was supposed to be played in <#${client.config.snakeChannel[interaction.guild.id]}> has been disabled`)
                    .setTimestamp();
                    client.config.snakeChannel[interaction.guild.id] = false;
                    client.snakeChannel[interaction.guild.id] = undefined;
                    try{
                        await client.dbHandler.deleteValue('globals', `snake`);
                    } catch {}
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Snake channel`)
                    .setCustomId(`channel-modal__snake`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`snake-channel-input`)
                    .setLabel(`The channel name or id`)
                    .setRequired(true)
                    .setPlaceholder(`No input given`)
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setStyle(TextInputStyle.Short);
                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    modal.addComponents(actionRow);
                    interaction.showModal(modal).catch(err => {});
                }
                break;
            case 'level-channel':
                if(['string', 'number'].includes(typeof client.config.level["notification-channel"][interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Level message channel disabled`)
                    .setDescription(`The level messages which were supposed to be send in <#${client.config.level["notification-channel"][interaction.guild.id]}> have been disabled`)
                    .setTimestamp();
                    client.config.level["notification-channel"][interaction.guild.id] = false;
                    client.xpChannel[interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Level messages`)
                    .setCustomId(`channel-modal__level`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`level-channel-input`)
                    .setLabel(`The channel name or id`)
                    .setRequired(true)
                    .setPlaceholder(`No input given`)
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setStyle(TextInputStyle.Short);
                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    modal.addComponents(actionRow);
                    interaction.showModal(modal).catch(err => {});
                }
                break;
            case 'ticket-category':
                if(['string', 'number'].includes(typeof client.config.tickets.parent[interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Ticket category disabled`)
                    .setDescription(`The category where the tickets were supposed to be placed in has been disabled as the tickets category`)
                    .setTimestamp();
                    client.config.tickets.parent[interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Ticket category`)
                    .setCustomId(`ticket-category-name-modal`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`ticket-category-input`)
                    .setLabel(`The category name or id`)
                    .setRequired(true)
                    .setPlaceholder(`No input given`)
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setStyle(TextInputStyle.Short);
                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    modal.addComponents(actionRow);
                    interaction.showModal(modal).catch(err => {});
                }
                break;
            case 'logs-channel':
                const selectTypeEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Select log type')
                .setDescription('Please select the type of log channel you would like to set up.')
                .setTimestamp();

                const logTypeSelect = new StringSelectMenuBuilder()
                .setCustomId('select-log-channel-type')
                .setPlaceholder('No log channel selected')
                .setOptions([{
                    label: 'Channel logs',
                    value: 'channel',
                    description: 'All logs related to modifications to channels'
                }, {
                    label: 'Member logs',
                    value: 'member',
                    description: 'All logs related to modifications to members'
                }, {
                    label: 'Role logs',
                    value: 'role',
                    description: 'All logs related to modifications to roles'
                }, {
                    label: 'Message logs',
                    value: 'message',
                    description: 'All logs related to modifications to messages'
                }, {
                    label: 'Ticket logs',
                    value: 'ticket',
                    description: 'All logs related to modifications to tickets'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const logTypeActionRow = new ActionRowBuilder().addComponents(logTypeSelect);

                interaction.update({embeds: [selectTypeEmbed], components: [logTypeActionRow]}).catch(err => {});
                break;
            case 'suggestion-channel':
                if(['string', 'number'].includes(typeof client.config.suggestion[interaction.guild.id].channel)){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Suggestion channel disabled`)
                    .setDescription(`The suggestion messages which were supposed to be send in <#${client.config.suggestion[interaction.guild.id].channel}> have been disabled`)
                    .setTimestamp();
                    client.config.suggestion[interaction.guild.id].channel = null;
                    client.suggestionChannel[interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Suggestion channel`)
                    .setCustomId(`channel-modal__suggestion`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`suggestion-channel-input`)
                    .setLabel(`The channel name or id`)
                    .setRequired(true)
                    .setPlaceholder(`No input given`)
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setStyle(TextInputStyle.Short);
                    const actionRow = new ActionRowBuilder().addComponents(textInput);
                    modal.addComponents(actionRow);
                    interaction.showModal(modal).catch(err => {});
                }
                break;
            case 'filter-channel':
                const filterSelectAction = new StringSelectMenuBuilder()
                .setCustomId(`filter-channel-action`)
                .setPlaceholder(`Please select an action`)
                .setOptions([{
                    label: 'Add',
                    value: 'add',
                    description: 'Add an anti-filter channel'
                }, {
                    label: 'Remove',
                    value: 'remove',
                    description: 'Remove an anti-filter channel'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);
                const selectActionEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select an action`)
                .setDescription(`Please select an action to execute the right function`)
                .setTimestamp();
                const filterActionRow = new ActionRowBuilder().addComponents(filterSelectAction);

                interaction.update({embeds: [selectActionEmbed], components: [filterActionRow]}).catch(err => {});
                break;
        }
    }
}
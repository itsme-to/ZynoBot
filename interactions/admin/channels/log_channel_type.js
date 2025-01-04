const { EmbedBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'select-log-channel-type',
        description: 'When a member selects the type of log channel to set'
    },
    run: function(client, interaction){
        const logChannel = interaction.values[0].toLowerCase();

        switch(logChannel){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change a channel has been cancelled`)
                .setTimestamp();
                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'channel':
                if(['string', 'number'].includes(typeof client.config.logs['channel'][interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Channel log channel disabled`)
                    .setDescription(`The channel log messages which were supposed to be send in <#${client.config.logs['channel'][interaction.guild.id]}> have been disabled`)
                    .setTimestamp();
                    client.config.logs['channel'][interaction.guild.id] = false;
                    client.logs['channel'][interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Channel logs channel`)
                    .setCustomId(`channel-modal__channel-logs`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`channel-logs-channel-input`)
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
            case 'member':
                if(['string', 'number'].includes(typeof client.config.logs['member'][interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Member logs channel disabled`)
                    .setDescription(`The member log messages which were supposed to be send in <#${client.config.logs['member'][interaction.guild.id]}> have been disabled`)
                    .setTimestamp();
                    client.config.logs['member'][interaction.guild.id] = false;
                    client.logs['member'][interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Member logs channel`)
                    .setCustomId(`channel-modal__member-logs`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`member-logs-channel-input`)
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
            case 'role':
                if(['string', 'number'].includes(typeof client.config.logs['role'][interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Role logs channel disabled`)
                    .setDescription(`The role log messages which were supposed to be send in <#${client.config.logs['role'][interaction.guild.id]}> have been disabled`)
                    .setTimestamp();
                    client.config.logs['role'][interaction.guild.id] = false;
                    client.logs['role'][interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Role logs channel`)
                    .setCustomId(`channel-modal__role-logs`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`role-logs-channel-input`)
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
            case 'message':
                if(['string', 'number'].includes(typeof client.config.logs['message'][interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Message logs channel disabled`)
                    .setDescription(`The message log messages which were supposed to be send in <#${client.config.logs['message'][interaction.guild.id]}> have been disabled`)
                    .setTimestamp();
                    client.config.logs['message'][interaction.guild.id] = false;
                    client.logs['message'][interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Message logs channel`)
                    .setCustomId(`channel-modal__message-logs`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`message-logs-channel-input`)
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
            case 'ticket':
                if(['string', 'number'].includes(typeof client.config.tickets['logs-channel'][interaction.guild.id])){
                    const disabled = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Tickets logs channel disabled`)
                    .setDescription(`The ticket log messages which were supposed to be send in <#${client.config.tickets['logs-channel'][interaction.guild.id]}> have been disabled`)
                    .setTimestamp();
                    client.config.tickets['logs-channel'][interaction.guild.id] = false;
                    client.ticketLogs[interaction.guild.id] = undefined;
                    configHandler(client, client.config);
                    interaction.update({embeds: [disabled], components: []}).catch(err => {});
                } else {
                    const modal = new ModalBuilder()
                    .setTitle(`Logs channel`)
                    .setCustomId(`channel-modal__ticket-logs`);
                    const textInput = new TextInputBuilder()
                    .setCustomId(`ticket-logs-channel-input`)
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
        }
    }
}
const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

function firstUpperCase(string){
    let firstletter = string.slice(0, 1).toUpperCase();
    let newstring = firstletter + string.slice(1, string.length);
    return newstring;
}

module.exports = {
    data: {
        id: 'confirm-channel',
        description: 'When the channel has been confirmed'
    },
    run: function(client, interaction){
        const channelType = interaction.customId.split('__')[1];
        const channel = client.interactionActions.get(`${channelType}-channel-${interaction.member.id}-${interaction.guild.id}`);
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        if(!channel) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        switch(channelType){
            case 'counting':
                client.config.countingChannel[interaction.guild.id] = channel.id;
                configHandler(client, client.config);
                client.countingChannel[interaction.guild.id] = channel;
                break;
            case 'leave':
                client.config.leave[interaction.guild.id].channel = channel.id;
                configHandler(client, client.config);
                client.leaveChannel[interaction.guild.id] = channel;
                break;
            case 'welcome':
                client.config.welcome[interaction.guild.id].channel = channel.id;
                configHandler(client, client.config);
                client.welcomeChannel[interaction.guild.id] = channel;
                break;
            case 'level':
                client.config.level["notification-channel"][interaction.guild.id] = channel.id;
                configHandler(client, client.config);
                client.xpChannel[interaction.guild.id] = channel;
                break;
            case 'snake':
                client.config.snakeChannel[interaction.guild.id] = channel.id;
                configHandler(client, client.config);
                client.snakeChannel[interaction.guild.id] = channel;
                break;
            case 'channel-logs':
                client.config.logs['channel'][interaction.guild.id] = channel.id;
                configHandler(client, client.config);
                client.logs['channel'][interaction.guild.id] = channel;
                break;
            case 'member-logs':
                client.config.logs['member'][interaction.guild.id] = channel.id;
                configHandler(client, client.config);
                client.logs['member'][interaction.guild.id] = channel;
                break;
            case 'role-logs':
                client.config.logs['role'][interaction.guild.id] = channel.id;
                configHandler(client, client.config);
                client.logs['role'][interaction.guild.id] = channel;
                break;
            case 'message-logs':
                client.config.logs['message'][interaction.guild.id] = channel.id;
                configHandler(client, client.config);
                client.logs['message'][interaction.guild.id] = channel;
                break;
            case 'ticket-logs':
                client.config.tickets['logs-channel'][interaction.guild.id] = channel.id;
                configHandler(client, client.config);
                client.ticketLogs[interaction.guild.id] = channel;
                break;
            case 'suggestion':
                client.config.suggestion[interaction.guild.id].channel = channel.id;
                configHandler(client, client.config);
                client.suggestionChannel[interaction.guild.id] = channel;
                break;
        }

        let channelTypeName = channelType.split('-').join(' ');

        const confirmed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`${firstUpperCase(channelTypeName)} channel saved`)
        .setDescription(`The new ${channelTypeName} channel (<#${channel.id}>) has been saved`)
        .setTimestamp();

        client.interactionActions.delete(`${channelType}-channel-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [confirmed], components: []}).catch(err => {});
    }
}
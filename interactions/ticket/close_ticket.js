const { EmbedBuilder, OverwriteType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const messages = require('../../messages.json');
const messageHandler = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions');

module.exports = {
    data: {
        id: 'close-ticket',
        description: `Closes an open ticket`
    },
    run: async function(client, interaction, cmd){
        if(cmd === false){
            interaction.deferReply({ephemeral: false}).catch(err => {});
            await wait(400);
        }
        var ticketFrom = client.tickets.filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(ch => typeof ch === 'string' ? ch === interaction.channel.id : ch.channel === interaction.channel.id).length > 0;
            } else if(typeof t.value === 'string'){
                return t.value === interaction.channel.id;
            } else {
                return false;
            }
        });
        var user = null;
        if(ticketFrom.size > 0){
            user = client.users.cache.get(ticketFrom.firstKey());
        } else {
            user = {id: 'unknown user id', username: 'unknown username', tag: 'unknown user tag', user: 'unknown user', send: null};
        }
        
        const failedClosing = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(messageHandler(client, interaction.member.user, user, interaction.channel, messages.tickets['close-ticket']['error-messages']['unknown-error'].title))
        .setDescription(messageHandler(client, interaction.member.user, user, interaction.channel, messages.tickets['close-ticket']['error-messages']['unknown-error'].message))
        .setTimestamp();

        const userIds = interaction.channel.permissionOverwrites.cache.filter(p => p.type === OverwriteType.Member).map(user => {
            return {
                id: user.id,
                deny: [PermissionFlagsBits.ViewChannel]
            };
        });
        userIds.push(...interaction.channel.permissionOverwrites.cache.filter(p => p.type === OverwriteType.Role).map(role => {
            return {
                id: role.id,
                deny: role.deny,
                allow: role.allow,
                type: role.type
            }
        }));

        interaction.channel.permissionOverwrites.set(userIds, 'Ticket closed').then(async () => {
            if(ticketFrom.size > 0){
                const userTickets = client.deepCopy(client.tickets.get(ticketFrom.firstKey()));
                if(typeof userTickets === 'string'){
                    try{
                        await client.dbHandler.setValue(`tickets`, {channel: interaction.channel.id, closed: true, claimed: false, category: false, autotag: [], guild: interaction.guild.id}, {memberId: ticketFrom.firstKey(), guildId: interaction.guild.id, channelId: interaction.channel.id});
                    } catch {}
                } else if(Array.isArray(userTickets)){
                    const ticketFilter = userTickets.filter(t => typeof t === 'string' ? t === interaction.channel.id : t.channel === interaction.channel.id);
                    const ticketInfo = ticketFilter[0];
                    if(ticketInfo){
                        try{
                            await client.dbHandler.setValue(`tickets`, {...ticketInfo, closed: true}, {memberId: ticketFrom.firstKey(), guildId: interaction.guild.id, channelId: interaction.channel.id});
                        } catch {}
                    }
                }
            }

            const reOpen = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['reopen-ticket'].button))
            .setCustomId(`reopen-ticket`);
            const deleteBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['close-ticket']['force-close-button']))
            .setCustomId(`close-ticket-force`);

            const btnActionRow = new ActionRowBuilder().addComponents(reOpen, deleteBtn);

            const ticketActionEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['close-ticket']['close-embed'].title))
            .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['close-ticket']['close-embed'].message))
            .setTimestamp();

            if(cmd === false){
                interaction.editReply({embeds: [ticketActionEmbed], components: [btnActionRow]}).catch(err => {});
            } else {
                interaction.channel.send({embeds: [ticketActionEmbed], components: [btnActionRow]}).catch(err => {});
            }
        }).catch(err => {
            if(client.config.debugger) console.log(err);
            if(cmd === true){
                interaction.editReply({embeds: [failedClosing]}).catch(err => {});
            } else {
                interaction.channel.send({embeds: [failedClosing]}).catch(err => {});
            }
        });
    }
}
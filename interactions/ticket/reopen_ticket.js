const { PermissionFlagsBits, EmbedBuilder, OverwriteType } = require('discord.js');
const { wait } = require('../../functions');
const handleMessage = require('../../handlers/handleMessages.js');
const messages = require('../../messages.json');

module.exports = {
    data: {
        id: 'reopen-ticket',
        description: 'When the user wants to reopen the ticket'
    },
    run: function(client, interaction){
        var ticketFrom = client.tickets.filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(ch => typeof ch === 'string' ? ch === interaction.channel.id : ch.channel === interaction.channel.id).length > 0;
            } else if(typeof t.value === 'string'){
                return t.value === interaction.channel.id;
            } else {
                return false;
            }
        });

        const userIds = interaction.channel.permissionOverwrites.cache.filter(p => p.type === OverwriteType.Member).map(user => {
            return {
                id: user.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: []
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

        const errorReopen = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets['reopen-ticket']['reopen-failed'].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets['reopen-ticket']['reopen-failed'].message))
        .setTimestamp();

        interaction.channel.permissionOverwrites.set(userIds).then(async () => {

            const userTickets = client.deepCopy(client.tickets.get(ticketFrom.firstKey()));
            if(typeof userTickets === 'string'){
                try{
                    await client.dbHandler.setValue(`tickets`, {channel: interaction.channel.id, category: false, claimed: false, autotag: [], closed: false, guild: interaction.guild.id}, {memberId: ticketFrom.firstKey(), channelId: interaction.channel.id, guildId: interaction.guild.id});
                } catch {}
            } else if(Array.isArray(userTickets)){
                const ticketFilter = userTickets.filter(t => typeof t === 'string' ? t === interaction.channel.id : t.channel === interaction.channel.id);
                if(ticketFilter.length > 0){
                    try {
                        await client.dbHandler.setValue(`tickets`, {...ticketFilter[0], closed: false}, {memberId: ticketFrom.firstKey(), channelId: interaction.channel.id, guildId: interaction.guild.id});
                    } catch {}
                }
            }

            const reopenedTicket = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets['reopen-ticket']['reopen-message'].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets['reopen-ticket']['reopen-message'].message))
            .setTimestamp();

            interaction.deferUpdate().catch(err => {});

            await wait(400);

            interaction.message.edit({embeds: [reopenedTicket], components: []}).catch(err => {});

        }).catch(err => {
            interaction.reply({embeds: [errorReopen]}).catch(err => {});
        });
        
    }
}
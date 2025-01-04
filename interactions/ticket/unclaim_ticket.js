const { ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { wait } = require('../../functions.js');
const messageHandler = require('../../handlers/handleMessages.js');
const messages = require('../../messages.json');

module.exports = {
    data: {
        id: 'unclaim-ticket',
        description: 'When a moderator wants to claim the ticket'
    },
    run: async function(client, interaction){
        var ticketFrom = client.tickets.filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(ch => typeof ch === 'string' ? ch === interaction.channel.id : ch.channel === interaction.channel.id).length > 0;
            } else if(typeof t.value === 'string'){
                return t.value === interaction.channel.id;
            } else {
                return false;
            }
        });

        var userTickets = client.deepCopy(client.tickets.get(ticketFrom.firstKey()));
        var ticket = Array.isArray(userTickets) ? userTickets.filter(t => typeof t === 'string' ? t === interaction.channel.id : t.channel === interaction.channel.id)[0] : userTickets;
        if(!Array.isArray(userTickets)){
            userTickets = [{channel: userTickets, closed: false, claimed: false, category: 'Unknown'}];
            ticket = userTickets[0];
        }
        if(typeof ticket === 'string'){
            ticket = {channel: ticket, closed: false, claimed: false, category: 'Unknown'};
        }
        if(ticket['claimed'] !== interaction.member.user.id) return interaction.deferUpdate().catch(err => {});
        ticket['claimed'] = false;

        let emptyCategory = {};
        emptyCategory[interaction.guild.id] = [];
        const categories = client.globals.get(`ticket-categories`) || emptyCategory;
        var filter = (categories[interaction.guild.id] || []).filter(c => c.name.toLowerCase() === (ticket['category'] || '').toLowerCase());
        
        try{
            await client.dbHandler.setValue(`tickets`, ticket, {memberId: ticketFrom.firstKey(), channelId: interaction.channel.id, guildId: interaction.guild.id});
        } catch {}

        interaction.deferUpdate().catch(err => {});
        
        var user = await client.cache.getUser(ticketFrom.firstKey());
        if(!user) user = {id: 'unknown', username: 'Unknown username', tag: 'Unknown tag'};
        await wait(400);

        let categoryMessage = filter.length > 0 ? filter[0].description ?? messages.tickets['ticket-messages'].category.message : messages.tickets['ticket-messages'].default.message;

        const categoryEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(messageHandler(client, user, undefined, interaction.channel, ticket['category'] === false ? messages.tickets['ticket-messages'].default.title : messages.tickets['ticket-messages'].category.title))
        .setDescription(messageHandler(client, user, undefined, interaction.channel, categoryMessage, [{CATEGORY: ticket['category'], CLAIMED_USER: messages.tickets['ticket-not-claimed'], CREATOR_USER: `<@!${ticketFrom.firstKey()}>`, QUESTIONS: ticket.questions ?? ''}]))
        .setTimestamp();

        const closeBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel(messageHandler(client, user, undefined, interaction.channel, messages.tickets['close-button']))
        .setCustomId(`close-ticket`);

        const closeActionRowComponents = [closeBtn];

        const closeActionRow = new ActionRowBuilder();

        if(client.config.tickets['auto-tag'][interaction.guild.id] === "PREFERENCE"){
            closeActionRowComponents.push(
                new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['tag-on-reply-button']))
                .setCustomId('tag-on-reply-ticket')
            );
        }
        if(client.config.tickets['claim-system'][interaction.guild.id]){
            closeActionRowComponents.push(new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel(messageHandler(client, user, undefined, interaction.channel, messages.tickets['claim-button']))
            .setCustomId(`claim-ticket`),
            new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel(messageHandler(client, user, undefined, interaction.channel, messages.tickets['unclaim-button']))
            .setCustomId(`unclaim-ticket`)
            .setDisabled(true));
        }

        closeActionRow.addComponents(...closeActionRowComponents);

        interaction.message.edit({embeds: [categoryEmbed], components: [closeActionRow]}).catch(err => {});
    }
}
const { EmbedBuilder } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        id: 'tag-on-reply-ticket',
        description: 'When a member wants to be tagged on a reply in the ticket or wants to stop being tagged'
    },
    run: async function(client, interaction){
        const getTicket = client.tickets.filter(t => {
            if(typeof t.value === 'string'){
                return t.value === interaction.channel.id;
            } else if(typeof t.value === 'object' && !Array.isArray(t.value) && t.value !== null){
                return t.value.channel === interaction.channel.id;
            } else if(Array.isArray(t.value)){
                return t.value.filter(_t => _t.channel === interaction.channel.id && _t.guild === interaction.guild.id).length > 0;
            } else return false;
        });

        const ticketNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets["tag-on-reply"]["ticket-not-found"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets["tag-on-reply"]["ticket-not-found"].message))
        .setTimestamp();

        if(getTicket.size === 0) return interaction.reply({ephemeral: true, embeds: [ticketNotFound]}).catch(err => {});

        const ticketOpener = getTicket.firstKey();
        let ticketInfo = client.deepCopy(client.tickets.get(ticketOpener) ?? []);
        if(typeof ticketInfo === 'string'){
            ticketInfo = [{channel: ticketInfo, closed: true, claimed: false, category: false, autotag: [], guild: interaction.guild.id}]
        } else if(typeof ticketInfo === 'object' && !Array.isArray(ticketInfo) && ticketInfo !== null){
            ticketInfo = [ticketInfo];
        }
        ticketInfo = ticketInfo.filter(t => {
            if(typeof t === 'string'){
                return t === interaction.channel.id;
            } else if(typeof t === 'object' && !Array.isArray(t) && t !== null){
                return t.channel === interaction.channel.id;
            } else return false;
        })[0];
        if(!ticketInfo) return interaction.reply({ephemeral: true, embeds: [ticketNotFound]}).catch(err => {});

        if(!Array.isArray(ticketInfo.autotag)){
            ticketInfo.autotag = [];
        }
        
        let memberIndex = ticketInfo.autotag.indexOf(interaction.member.id);
        if(memberIndex >= 0){
            ticketInfo.autotag.splice(memberIndex, 1);
            try{
                await client.dbHandler.setValue(`tickets`, ticketInfo, {memberId: ticketOpener, guildId: interaction.guild.id, channelId: interaction.channel.id});
            } catch {}

            const disabled = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets["tag-on-reply"].disabled.title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets["tag-on-reply"].disabled.message))
            .setTimestamp();

            return interaction.reply({ephemeral: true, embeds: [disabled]}).catch(err => {});
        } else {
            ticketInfo.autotag.push(interaction.member.id);
            try{
                await client.dbHandler.setValue(`tickets`, ticketInfo, {memberId: ticketOpener, guildId: interaction.guild.id, channelId: interaction.channel.id});
            } catch {}

            const enabled = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets["tag-on-reply"].enabled.title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.tickets["tag-on-reply"].enabled.message))
            .setTimestamp();

            return interaction.reply({ephemeral: true, embeds: [enabled]}).catch(err => {});
        }
    }
}
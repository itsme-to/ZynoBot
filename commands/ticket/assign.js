const { EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, Collection } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions');

module.exports = {
    data: {
        name: 'assign',
        description: 'Assign a user to this ticket',
        category: 'Tickets',
        options: [{type: 6, name: 'user', description: 'The user to asign to the ticket', required: true}],
        defaultEnabled: false,
        permissions: 'ManageMessages',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const claimSystemDisabled = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['claim-system-disabled'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['claim-system-disabled'].message))
        .setTimestamp();
        const notTicket = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['not-ticket'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['not-ticket'].message))
        .setTimestamp();
        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-add'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-add'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();
        const noMention = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-mention-add'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-mention-add'].message))
        .setTimestamp();

        if(client.config.tickets['claim-system'][message.guild.id] === false) return sendMessage({embeds: [claimSystemDisabled]}).catch(err => {});

        const ticketFilter = client.tickets.filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(t => typeof t === 'string' ? t === message.channel.id : t.channel === message.channel.id && t.guild === message.guild.id).length > 0;
            } else if(typeof t.value === 'string'){
                return t.value === message.channel.id;
            } else {
                return false;
            }
        });

        if(ticketFilter.size === 0) return sendMessage({embeds: [notTicket]}).catch(err => {});

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        if(interaction === false) if(!message.mentions.members.first()) return sendMessage({embeds: [noMention]}).catch(err => {});
        if(interaction === false) if(message.mentions.members.first().id === client.user.id) return sendMessage({embeds: [noMention]}).catch(err => {});

        var user = interaction === false ? message.mentions.members.first().user : message.options.getUser('user');

        const userTickets = ticketFilter.first();
        const userId = ticketFilter.firstKey();

        if(!Array.isArray(userTickets)){
            const outdatedTicket = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
            .setTitle(handleMessage(client, message.member.user, assignedUser, message.channel, messages.tickets.commands['error-messages']['ticket-outdated'].title))
            .setDescription(handleMessage(client, message.member.user, assignedUser, message.channel, messages.tickets.commands['error-messages']['ticket-outdated'].message))
            .setTimestamp();

            return sendMessage({embeds: [outdatedTicket]}).catch(err => {});
        }

        let ticketInfo = userTickets.filter(t => t.channel === message.channel.id && t.guild === message.guild.id)[0];

        if(typeof ticketInfo?.claimed === 'string'){
            const assignedUser = client.users.cache.get(ticketInfo.claimed);

            const ticketAlreadyAssigned = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
            .setTitle(handleMessage(client, message.member.user, assignedUser, message.channel, messages.tickets.commands['error-messages']['ticket-already-assigned'].title))
            .setDescription(handleMessage(client, message.member.user, assignedUser, message.channel, messages.tickets.commands['error-messages']['ticket-already-assigned'].message))
            .setTimestamp();

            return sendMessage({embeds: [ticketAlreadyAssigned]}).catch(err => {});
        } else if(userId === user.id){
            const ticketOwnerError = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
            .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['error-messages']['assign-owner'].title))
            .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['error-messages']['assign-owner'].message))
            .setTimestamp();

            return sendMessage({embeds: [ticketOwnerError]}).catch(err => {});
        }

        ticketInfo.claimed = user?.id || false;

        try{
            await client.dbHandler.setValue(`tickets`, ticketInfo, {memberId: userId, channelId: message.channel.id, guildId: message.guild.id});
        } catch {}

        const ticketAssigned = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['success-messages']['ticket-assigned'].title))
        .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.tickets.commands['success-messages']['ticket-assigned'].message))
        .setTimestamp();

        sendMessage({embeds: [ticketAssigned]}).catch(err => {});
        
        await wait(400);

        const ticketCategories = client.deepCopy((client.globals.get('ticket-categories') || {}))[message.guild.id] || [];
        const ticketCategory = ticketCategories.filter(c => c.name === ticketInfo?.category)[0];
        let categoryMessage = ticketCategory ? (ticketCategory?.description ?? messages.tickets['ticket-messages'].category.message) : messages.tickets['ticket-messages'].default.message;

        const categoryEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, ticketInfo['category'] === false ? messages.tickets['ticket-messages'].default.title : messages.tickets['ticket-messages'].category.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, categoryMessage, [{CATEGORY: ticketInfo['category'], CLAIMED_USER: `<@!${user?.id}>`, CREATOR_USER: `<@!${userId}>`, QUESTIONS: ticketInfo.questions ?? ''}]))
        .setTimestamp();

        const closeBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets['close-button']))
        .setCustomId(`close-ticket`);

        const closeActionRowComponents = [closeBtn];

        if(client.config.tickets['auto-tag'][message.guild.id] === "PREFERENCE"){
            closeActionRowComponents.push(
                new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets['tag-on-reply-button']))
                .setCustomId('tag-on-reply-ticket')
            );
        }
        if(client.config.tickets['claim-system'][message.guild.id] === true){
            closeActionRowComponents.push(new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets['claim-button']))
            .setCustomId(`claim-ticket`)
            .setDisabled(true),
            new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets['unclaim-button']))
            .setCustomId(`unclaim-ticket`));
        }

        const closeActionRow = new ActionRowBuilder().addComponents(...closeActionRowComponents);

        if(typeof ticketInfo.message === 'string'){
            message.channel.messages.fetch(ticketInfo.message).then(async msg => {
                await wait(400);
                msg.edit(client.handleContent(msg, {embeds: [categoryEmbed], components: [closeActionRow]})).catch(err => {});
            }).catch(err => {
                if(client.config.debugger) console.log(err);
            });
        } else {
            let ticketMessages = new Collection();
            try{
                let fetchedTicketMessages = await message.channel.messages.fetch({after: 0, limit: 100});
                fetchedTicketMessages.sort((a, b) => {
                    return a.id - b.id;
                });
                ticketMessages = ticketMessages.concat(fetchedTicketMessages);
                await wait(400);
                while(fetchedTicketMessages.size === 100){
                    fetchedTicketMessages = await message.channel.messages.fetch({limit: 100, after: fetchedTicketMessages.lastKey()});
                    fetchedTicketMessages.sort((a, b) => {
                        return a.id - b.id;
                    });
                    ticketMessages = ticketMessages.concat(fetchedTicketMessages);
                    await wait(400);
                }
            } catch {}
            if(ticketMessages.size > 0){
                const botMessages = ticketMessages.filter(m => m.author.id === client.user.id);
                botMessages.sort((a, b) => {
                    return a.id - b.id;
                });
                const startMessage = botMessages.first();
                startMessage.edit(client.handleContent(startMessage, {embeds: [categoryEmbed], components: [closeActionRow]})).catch(err => {});
            }
        }
    }
}
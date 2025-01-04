const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits, PermissionsBitField, ChannelType, OverwriteType } = require('discord.js');
const messages = require('../messages.json');
const messageHandler = require('../handlers/handleMessages.js');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async (client, interaction, instant, filter, category, questions) => {
    try {
        let categoryMessage = filter.length > 0 ? filter[0].description || messages.tickets['ticket-messages'].category.message : messages.tickets['ticket-messages'].category.message;

        const categoryEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['ticket-messages'].category.title))
            .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, categoryMessage, [{ QUESTIONS: questions || 'No questions provided', CATEGORY: filter.length > 0 ? filter[0].name : `Unknown category`, CLAIMED_USER: messages.tickets['ticket-not-claimed'], CREATOR_USER: `<@!${interaction.member.user.id}>` }]))
            .setTimestamp();

        const closeBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['close-button']))
            .setCustomId(`close-ticket`);

        const customButtons = [];
        if (client.config.tickets['auto-tag'][interaction.guild.id] === "PREFERENCE") {
            customButtons.push(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['tag-on-reply-button']))
                    .setCustomId('tag-on-reply-ticket')
            );
        }
        if (client.config.tickets['claim-system'][interaction.guild.id] === true) {
            customButtons.push(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['claim-button']))
                    .setCustomId(`claim-ticket`),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['unclaim-button']))
                    .setCustomId(`unclaim-ticket`)
                    .setDisabled(true)
            );
        }

        const closeActionRow = new ActionRowBuilder().addComponents(
            closeBtn,
            ...customButtons
        );

        var moderatorTags = ``;
        if (client.config.tickets['tag-support'][interaction.guild.id] === true) {
            for (var i = 0; i < client.config.tickets.roles[interaction.guild.id].length; i++) {
                moderatorTags += `<@&${client.config.tickets.roles[interaction.guild.id][i]}> `;
            }
        }
        if (typeof filter[0]?.role === 'string' && client.config.tickets['tag-support'][interaction.guild.id] === true) {
            moderatorTags += `<@&${filter[0].role}>`;
        }

        if (instant) {
            if (typeof questions !== 'string') {
                interaction.message.edit({ embeds: [...interaction.message.embeds.map(e => new EmbedBuilder(e.toJSON()))], components: [...interaction.message.components.map(a => new ActionRowBuilder(a.toJSON()))] }).catch(err => { });
                await wait(400);
            }
            var ticket = client.deepCopy((client.tickets.get(interaction.member.id) || []));

            if (ticket) {
                const openTicket = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({ iconURL: client.user.displayAvatarURL({ dynamic: true }), name: client.user.username })
                    .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['open-ticket']['error-messages']['open-ticket'].title, [{ CHANNEL_ID: ticket, TICKET_COUNT: ticket.filter(t => t.guild === interaction.guild.id).length }]))
                    .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['open-ticket']['error-messages']['open-ticket'].message, [{ CHANNEL_ID: ticket, TICKET_COUNT: ticket.filter(t => t.guild === interaction.guild.id).length }]))
                    .setTimestamp();

                if (ticket.filter(t => t.guild === interaction.guild.id).length >= client.config.tickets.max[interaction.guild.id]) return interaction.reply({ embeds: [openTicket], ephemeral: true }).catch(err => { });
            }

            const loadingEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets.commands['success-messages']['loading-create-ticket'].title))
                .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets.commands['success-messages']['loading-create-ticket'].message))
                .setTimestamp();
            var msg = null;
            try {
                msg = await interaction.reply({ embeds: [loadingEmbed], ephemeral: true });
            } catch { }
            await wait(400);
            const failed = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({ iconURL: client.user.displayAvatarURL({ dynamic: true }), name: client.user.username })
                .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['open-ticket']['error-messages']['unknown-error'].title))
                .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['open-ticket']['error-messages']['unknown-error'].message))
                .setTimestamp();

            var moderatorPermissionsBitField = typeof client.config.tickets.roles[interaction.guild.id] !== 'undefined' && Array.isArray(client.config.tickets.roles[interaction.guild.id]) ? client.config.tickets.roles[interaction.guild.id].reduce((arr, id) => {
                arr.push({
                    id: String(id),
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
                    type: OverwriteType.Role
                });
                return arr;
            }, []) : [];

            if (typeof filter[0]?.role === 'string') {
                moderatorPermissionsBitField.push({
                    id: filter[0]?.role,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
                    type: OverwriteType.Role
                });
            }

            var permissionOverwrites = [{
                id: interaction.member.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
                type: OverwriteType.Member
            },
            {
                id: interaction.guild.members.me.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
                type: OverwriteType.Member
            },
            {
                id: interaction.guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
                type: OverwriteType.Role
            }];

            permissionOverwrites.push(...moderatorPermissionsBitField);

            try {
                let ticketChannel = await interaction.guild.channels.create({
                    name: category.split(' ').join('-') + `-${interaction.member.displayName}`,
                    type: ChannelType.GuildText,
                    parent: ['number', 'string'].indexOf(typeof filter[0].parentId) > 0 ? filter[0].parentId.toString() : (client.config.tickets.parent[interaction.guild.id] || undefined),
                    permissionOverwrites: permissionOverwrites
                });
                await wait(400);

                let ticketMsg = await ticketChannel.send({ embeds: [categoryEmbed], components: [closeActionRow], content: `<@!${interaction.member.id}>${moderatorTags}` });

                var totalTicketAmount = client.deepCopy((client.globals.get(`ticket_count`) || {}));
                var ticketAmount = totalTicketAmount[interaction.guild.id] || { closed: 0, open: 0 };
                ++ticketAmount.open;
                totalTicketAmount[interaction.guild.id] = ticketAmount;
                try {
                    await client.dbHandler.setValue(`globals`, totalTicketAmount, { 'globalsKey': 'ticket_count' });
                } catch { }

                var ticketInfo = client.deepCopy((client.tickets.get(interaction.member.id) || []));
                if (!Array.isArray(ticketInfo)) {
                    if (typeof ticketInfo === 'string') {
                        ticketInfo = [{ channel: ticketInfo, closed: false, claimed: false, category: 'Unknown', guild: interaction.guild.id }];
                    } else {
                        ticketInfo = [];
                    }
                }

                await client.dbHandler.setValue(`tickets`, { channel: ticketChannel.id, closed: false, claimed: false, category: filter.length > 0 ? filter[0].name : 'Unknown', message: ticketMsg.id, questions: questions, guild: interaction.guild.id }, { memberId: interaction.member.id, channelId: ticketChannel.id, guildId: interaction.guild.id });

                const ticketCreated = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setTitle(messageHandler(client, interaction.member.user, undefined, ticketChannel, messages.tickets.commands['success-messages']['ticket-created-confirmation'].title))
                    .setDescription(messageHandler(client, interaction.member.user, undefined, ticketChannel, messages.tickets.commands['success-messages']['ticket-created-confirmation'].message))
                    .setTimestamp();

                if (msg === null) interaction.reply(client.handleContent(interaction, { embeds: [ticketCreated], ephemeral: true })).catch(err => { });
                else interaction.editReply(client.handleContent(interaction, { embeds: [ticketCreated] })).catch(err => { });

                return ticketChannel;

            } catch (err) {
                if (msg === null) interaction.reply(client.handleContent(interaction, { embeds: [failed], ephemeral: true })).catch(err => { });
                else interaction.editReply(client.handleContent(interaction, { embeds: [failed] })).catch(err => { });
                if (client.debugger) console.log(`[SYSTEM]`, err);
            }
        } else {
            interaction.deferUpdate().catch(err => { });
            var ticketFrom = client.tickets.filter(t => {
                if (Array.isArray(t.value)) {
                    return t.value.filter(ch => typeof ch === 'string' ? ch === interaction.channel.id : ch.channel === interaction.channel.id).length > 0;
                } else if (typeof t.value === 'string') {
                    return t.value === interaction.channel.id;
                } else {
                    return false;
                }
            });

            if (ticketFrom.size === 0) return;

            var userTickets = client.deepCopy(client.tickets.get(ticketFrom.firstKey()));
            var ticket = Array.isArray(userTickets) ? userTickets.filter(t => typeof t === 'string' ? t === interaction.channel.id : t.channel === interaction.channel.id)[0] : userTickets;
            if (!Array.isArray(userTickets)) {
                userTickets = [{ channel: userTickets, closed: false, claimed: false, category: 'Unknown' }];
                ticket = userTickets[0];
            }
            if (typeof ticket === 'string') {
                ticket = { channel: ticket, closed: false, claimed: false, category: 'Unknown' };
            }
            ticket['category'] = filter.length > 0 ? filter[0].name : 'Unknown';
            try {
                await client.dbHandler.setValue(`tickets`, { ...ticket, questions: questions || 'No questions provided' }, { memberId: ticketFrom.firstKey(), guildId: interaction.guild.id, channelId: interaction.channel.id });
            } catch { }

            interaction.message.edit(client.handleContent(interaction, { embeds: [categoryEmbed], components: [closeActionRow] }));

            await wait(400);

            if (ticketFrom.size > 0) {
                try {
                    var member = await client.cache.getMember(ticketFrom.firstKey(), interaction.guild);
                    var newTicketName = category.split(' ').join('-') + `-${member.displayName}`;
                    var bitfield = {};
                    bitfield[PermissionFlagsBits.SendMessages] = true;
                    await interaction.channel.permissionOverwrites.edit(ticketFrom.firstKey(), bitfield);
                    await wait(400);
                    if (typeof filter[0]?.role === 'string') {
                        var roleBitfield = {};
                        roleBitfield[PermissionsBitField.Flags.SendMessages] = true;
                        roleBitfield[PermissionsBitField.Flags.ViewChannel] = true;
                        roleBitfield[PermissionsBitField.Flags.ReadMessageHistory] = true;
                        await interaction.channel.permissionOverwrites.create(filter[0].role, roleBitfield);
                        await wait(400);
                    }
                    await wait(400);
                    var editChannelOptions = {
                        name: newTicketName
                    };
                    if (['number', 'string'].indexOf(typeof filter[0].parentId) > 0) {
                        editChannelOptions['parent'] = filter[0].parentId.toString();
                    }
                    interaction.channel.edit(editChannelOptions, `User selected category`).catch(err => {
                        if (client.debugger) console.log(`[SYSTEM]`, err);
                    });
                } catch { }
            }
            if (client.config.tickets.roles[interaction.guild.id].length > 0 || typeof filter[0]?.role === 'string' && client.config.tickets['tag-support'][interaction.guild.id] === true) interaction.message.reply({ content: moderatorTags }).catch(err => { });

            return interaction.channel;
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        interaction.reply({ content: 'An error occurred while creating the ticket. Please try again later.', ephemeral: true });
    }
}
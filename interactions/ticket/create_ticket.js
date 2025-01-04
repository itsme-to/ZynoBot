const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionsBitField, ChannelType, ButtonStyle, OverwriteType, StringSelectMenuBuilder } = require('discord.js');
const messages = require('../../messages.json');
const messageHandler = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions');

function firstUpperCase(string) {
    var firstLetter = string.slice(0, 1).toUpperCase();
    var newString = firstLetter + string.slice(1, string.length);
    return newString;
}

async function updateTicketEmbed(message, answers, ticketInfo) {
    // Fetch the original message containing the embed
    let ticketMessage;
    try {
        ticketMessage = await message.channel.messages.fetch(ticketInfo.message);
    } catch (error) {
        console.error('Error fetching ticket message:', error);
        return;
    }

    // Build the new embed
    const newEmbed = new EmbedBuilder(ticketMessage.embeds[0].toJSON()) // clone the original embed
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, categoryMessage, [{
            CATEGORY: ticketInfo['category'],
            CLAIMED_USER: `<@!${ticketInfo.claimed}>`,
            CREATOR_USER: `<@!${ticketInfo.creator}>`,
            QUESTIONS: answers.join('\n') // join all answers
        }]));

    // Update the message with the new embed
    try {
        await ticketMessage.edit({ embeds: [newEmbed] });
    } catch (error) {
        console.error('Error updating ticket message:', error);
    }
}

module.exports = {
    data: {
        id: 'ticket-button',
        description: 'Creates the tickets'
    },
    run: async function (client, interaction) {
        if (client.config.tickets['instant-category'][interaction.guild.id]) return interaction.deferUpdate().catch(err => { });
        const failed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({ iconURL: client.user.displayAvatarURL({ dynamic: true }), name: client.user.username })
            .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['open-ticket']['error-messages']['unknown-error'].title))
            .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['open-ticket']['error-messages']['unknown-error'].message))
            .setTimestamp();

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

        var moderatorTags = ``;

        var moderatorPermissionsBitField = typeof client.config.tickets.roles[interaction.guild.id] !== 'undefined' && Array.isArray(client.config.tickets.roles[interaction.guild.id]) ? client.config.tickets.roles[interaction.guild.id].reduce((arr, id) => {
            arr.push({
                id: String(id),
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.SendMessages],
                type: 'role'
            });
            if (client.config.tickets['tag-support'][interaction.guild.id] === true) moderatorTags += `<@&${String(id)}>`;
            return arr;
        }, []) : [];

        var denyCreator = [];
        var allowCreator = [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory];
        let emptyTicketCategories = {};
        emptyTicketCategories[interaction.guild.id] = [];
        if ((client.deepCopy((client.globals.get(`ticket-categories`) || emptyTicketCategories))[interaction.guild.id] || []).length > 0) denyCreator.push(PermissionsBitField.Flags.SendMessages);
        else allowCreator.push(PermissionsBitField.Flags.SendMessages);

        var permissionOverwrites = [{
            id: interaction.member.id,
            allow: allowCreator,
            deny: denyCreator.length > 0 ? denyCreator : undefined,
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

        interaction.guild.channels.create({
            name: `ticket-${interaction.member.displayName}`,
            type: ChannelType.GuildText,
            parent: client.config.tickets.parent[interaction.guild.id] || undefined,
            permissionOverwrites: permissionOverwrites
        }).then(async channel => {

            const ticketCreated = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(messageHandler(client, interaction.member.user, undefined, channel, messages.tickets.commands['success-messages']['ticket-created-confirmation'].title))
                .setDescription(messageHandler(client, interaction.member.user, undefined, channel, messages.tickets.commands['success-messages']['ticket-created-confirmation'].message))
                .setTimestamp();

            if (msg === null) interaction.reply(client.handleContent(interaction, { embeds: [ticketCreated], ephemeral: true })).catch(err => { });
            else interaction.editReply(client.handleContent(interaction, { embeds: [ticketCreated] })).catch(err => { });
            await wait(600);

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

            let emptyCategory = {};
            emptyCategory[interaction.guild.id] = [];
            const categories = client.deepCopy((client.globals.get(`ticket-categories`) || emptyCategory));

            if ((categories[interaction.guild.id] || []).length === 0) {
                let ticketObj = { channel: channel.id, closed: false, claimed: false, category: false, autotag: [], guild: interaction.guild.id };
                ticketInfo.push(ticketObj);
                try {
                    await client.dbHandler.setValue(`tickets`, ticketObj, { memberId: interaction.member.id, channelId: channel.id, guildId: interaction.guild.id });
                } catch { }
                const openEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({ iconURL: client.user.displayAvatarURL({ dynamic: true }), name: client.user.username })
                    .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['ticket-messages'].default.title))
                    .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['ticket-messages'].default.message, [{ CLAIMED_USER: messages.tickets['ticket-not-claimed'], CREATOR_USER: `<@!${interaction.member.user.id}>` }]))
                    .setTimestamp();

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

                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['close-button']))
                        .setCustomId(`close-ticket`),
                    ...customButtons
                );
                channel.send(client.handleContent(interaction, { embeds: [openEmbed], components: [actionRow], content: `<@!${interaction.member.id}>${moderatorTags}` })).then(async msg => {
                    let currentTicketInfo = ticketInfo.filter(t => t.channel === channel.id && t.guild === interaction.guild.id)[0];
                    currentTicketInfo['message'] = msg.id;
                    try {
                        await client.dbHandler.setValue(`tickets`, currentTicketInfo, { memberId: interaction.member.id, guildId: interaction.guild.id, channelId: channel.id });
                    } catch { }
                }).catch(console.log);
            } else {
                let ticketObj = { channel: channel.id, closed: false, claimed: false, category: 'Unknown', autotag: [], guild: interaction.guild.id };
                ticketInfo.push(ticketObj);
                try {
                    await client.dbHandler.setValue(`tickets`, ticketObj, { memberId: interaction.member.id, guildId: interaction.guild.id, channelId: channel.id })
                } catch { }
                const openEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({ iconURL: client.user.displayAvatarURL({ dynamic: true }), name: client.user.username })
                    .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['category-message'].title))
                    .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['category-message'].message))
                    .setTimestamp();

                if (client.config.tickets.categoryType[interaction.guild.id] === "BUTTONS") {
                    const actionRows = [];
                    const buttons = [[]];

                    for (var i = 0; i < categories[interaction.guild.id].length; i++) {
                        var category = categories[interaction.guild.id][i];
                        var btnArr = buttons[buttons.length - 1];
                        if (btnArr.length === 5) {
                            buttons.push([]);
                            btnArr = buttons[buttons.length - 1];
                        }
                        const categoryButton = new ButtonBuilder()
                            .setStyle(ButtonStyle[firstUpperCase(category.color)])
                            .setLabel(category.name)
                            .setCustomId(`ticket-category-select__${category.name.toLowerCase().split(' ').join('-')}`);
                        if (typeof category.emote === 'string') {
                            categoryButton.setEmoji(category.emote);
                        }
                        btnArr.push(categoryButton);
                    }

                    buttons.push([
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger)
                            .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['close-button']))
                            .setCustomId(`close-ticket`)
                    ]);

                    for (var i = 0; i < buttons.length; i++) {
                        var btns = buttons[i];
                        actionRows.push(new ActionRowBuilder().addComponents(...btns));
                    }

                    channel.send(client.handleContent(interaction, { embeds: [openEmbed], components: [...actionRows], content: `<@!${interaction.member.id}>` })).then(async msg => {
                        let currentTicketInfo = ticketInfo.filter(t => t.channel === channel.id && t.guild === interaction.guild.id)[0];
                        currentTicketInfo['message'] = msg.id;
                        try {
                            await client.dbHandler.setValue(`tickets`, currentTicketInfo, { memberId: interaction.member.id, guildId: interaction.guild.id, channelId: channel.id })
                        } catch { }
                    }).catch(err => { });
                } else if (client.config.tickets.categoryType[interaction.guild.id] === "MENU") {
                    const selectMenu = new StringSelectMenuBuilder()
                        .setPlaceholder(`No category selected`)
                        .setCustomId('ticket-category-select')
                        .setOptions([...categories[interaction.guild.id].map(c => {
                            let obj = { label: c.name, value: c.name.toLowerCase().split(' ').join('-') };
                            if (typeof c.emote === 'string') {
                                obj['emoji'] = c.emote;
                            }
                            return obj;
                        })]);

                    const selectMenuActionRow = new ActionRowBuilder().addComponents(selectMenu);

                    const closeBtn = new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['close-button']))
                        .setCustomId(`close-ticket`);

                    const closeActionRow = new ActionRowBuilder().addComponents(closeBtn);

                    channel.send(client.handleContent(interaction, { embeds: [openEmbed], components: [selectMenuActionRow, closeActionRow], content: `<@!${interaction.member.id}>` })).then(async msg => {
                        let currentTicketInfo = ticketInfo.filter(t => t.channel === channel.id && t.guild === interaction.guild.id)[0];
                        currentTicketInfo['message'] = msg.id;
                        try {
                            await client.dbHandler.setValue(`tickets`, currentTicketInfo, { memberId: interaction.member.id, guildId: interaction.guild.id, channelId: channel.id });
                        } catch { }
                    }).catch(err => { });
                }
            }
        }).catch(err => {
            if (client.debugger) console.log(`[SYSTEM]`, err);
            if (msg === null) interaction.reply({ embeds: [failed], ephemeral: true }).catch(err => { });
            else interaction.editReply({ embeds: [failed] }).catch(err => { });
        });
    }
}
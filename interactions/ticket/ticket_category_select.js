const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const messages = require('../../messages.json');
const messageHandler = require('../../handlers/handleMessages.js');
const createTicket = require('../../handlers/createTicket.js');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    data: {
        id: 'ticket-category-select',
        description: 'Creates the tickets'
    },
    run: async function (client, interaction) {
        try {
            await wait(400);

            let emptyCategory = {};
            emptyCategory[interaction.guild.id] = [];
            const categories = client.deepCopy((client.globals.get(`ticket-categories`) || emptyCategory));
            var category, filter;
            if (interaction.isButton()) {
                category = interaction.customId.split('__')[1].split('-').join(' ');
                filter = (categories[interaction.guild.id] || []).filter(c => c.name.toLowerCase() === category.toLowerCase());
            } else {
                category = interaction.values[0].toLowerCase().split('-').join(' ');
                filter = (categories[interaction.guild.id] || []).filter(c => c.name.toLowerCase() === category.toLowerCase());
            }

            if (!filter[0]) {
                const categoryNotExist = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets.commands['error-messages']['category-doesnt-exist'].title))
                    .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets.commands['error-messages']['category-doesnt-exist'].message))
                    .setTimestamp();

                return interaction.reply(client.handleContent(interaction, { embeds: [categoryNotExist], ephemeral: true })).catch(err => console.error('Error replying with category not exist message:', err));
            }

            if (client.config.tickets['instant-category'][interaction.guild.id]) {
                var ticket = client.deepCopy((client.tickets.get(interaction.member.id) || []));

                if (ticket) {
                    const openTicket = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({ iconURL: client.user.displayAvatarURL({ dynamic: true }), name: client.user.username })
                        .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['open-ticket']['error-messages']['open-ticket'].title, [{ CHANNEL_ID: ticket, TICKET_COUNT: ticket.filter(t => t.guild === interaction.guild.id).length }]))
                        .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['open-ticket']['error-messages']['open-ticket'].message, [{ CHANNEL_ID: ticket, TICKET_COUNT: ticket.filter(t => t.guild === interaction.guild.id).length }]))
                        .setTimestamp();

                    if (ticket.filter(t => t.guild === interaction.guild.id).length >= client.config.tickets.max[interaction.guild.id]) return interaction.reply({ embeds: [openTicket], ephemeral: true }).catch(err => console.error('Error replying with open ticket message:', err));
                }

                interaction.message.edit({ embeds: [...interaction.message.embeds.map(e => new EmbedBuilder(e.toJSON()))], components: [...interaction.message.components.map(a => new ActionRowBuilder(a.toJSON()))] }).catch(err => console.error('Error editing interaction message:', err));
                await wait(400);
            } else {
                var ticketFrom = client.tickets.filter(t => {
                    if (Array.isArray(t.value)) {
                        return t.value.filter(ch => typeof ch === 'string' ? ch === interaction.channel.id : ch.channel === interaction.channel.id).length > 0;
                    } else if (typeof t.value === 'string') {
                        return t.value === interaction.channel.id;
                    } else {
                        return false;
                    }
                });

                if (ticketFrom.size === 0) return interaction.deferUpdate().catch(err => console.error('Error deferring update:', err));
            }

            if (Array.isArray(filter[0]?.questions) && filter[0].questions.length > 0) {
                const modal = new ModalBuilder()
                    .setCustomId(`ticket-questions__${category.toLowerCase().split(' ').join('-')}`)
                    .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets['questions-title']));

                for (let i = 0; i < filter[0].questions.length; i++) {
                    const questionInput = new TextInputBuilder()
                        .setStyle(TextInputStyle.Paragraph)
                        .setLabel(filter[0].questions[i])
                        .setRequired(true)
                        .setMaxLength(500)
                        .setCustomId(`question-${i}`);
                    modal.addComponents((new ActionRowBuilder()).addComponents(questionInput));
                }

                interaction.showModal(modal).catch(err => console.error('Error showing modal:', err));
            } else {
                await createTicket(client, interaction, client.config.tickets['instant-category'][interaction.guild.id], filter, category, []);
            }
        } catch (error) {
            console.error('Error in ticket-category-select interaction:', error);
            interaction.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true }).catch(err => console.error('Error replying with failure message:', err));
        }
    }
}
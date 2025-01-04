const { EmbedBuilder } = require("discord.js");
const messages = require('../../messages.json');
const messageHandler = require('../../handlers/handleMessages.js');
const createTicket = require('../../handlers/createTicket.js');

module.exports = {
    data: {
        id: 'ticket-questions',
        description: 'When a member answers the corresponding questions to the ticket category'
    },
    run: async function (client, interaction) {
        try {
            let emptyCategory = {};
            emptyCategory[interaction.guild.id] = [];
            const categories = client.deepCopy((client.globals.get(`ticket-categories`) || emptyCategory));
            var category = interaction.customId.split('__')[1].split('-').join(' ');

            var filter = (categories[interaction.guild.id] || []).filter(c => c.name.toLowerCase() === category.toLowerCase());

            if (!filter[0]) {
                const categoryNotExist = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                    .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets.commands['error-messages']['category-doesnt-exist'].title))
                    .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets.commands['error-messages']['category-doesnt-exist'].message))
                    .setTimestamp();

                return interaction.reply(client.handleContent(interaction, { embeds: [categoryNotExist], ephemeral: true })).catch(err => console.error('Error replying with category not exist message:', err));
            }

            if (!Array.isArray(filter[0]?.questions) || filter[0].questions.length === 0) {
                const ticketChannel = await createTicket(client, interaction, client.config.tickets['instant-category'][interaction.guild.id], filter, category, '');

                if (ticketChannel) {
                    const noQuestionsEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
                        .setTitle('Ticket Details')
                        .setDescription(`**Category:** ${category}\n\nNo questions were provided for this category.`)
                        .setTimestamp();

                    await ticketChannel.send({ embeds: [noQuestionsEmbed] });
                } else {
                    console.error('Ticket channel is undefined');
                }
            } else {
                const answers = Array.from(interaction.fields.fields.values()).map(a => {
                    let answer = (a.value ?? '').split("\n").join("\n> ");
                    let index = a.customId.split('question-')[1] ?? NaN;
                    if (!/^[0-9]{1}$/.test(index)) return messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets["questions-template"], [{ QUESTION: 'Unknown question', ANSWER: answer }]);
                    index = parseInt(index);
                    if (index >= filter[0].questions.length) return messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets["questions-template"], [{ QUESTION: 'Unknown question', ANSWER: answer }]);
                    else return messageHandler(client, interaction.member.user, undefined, interaction.channel, messages.tickets["questions-template"], [{ QUESTION: filter[0].questions[index], ANSWER: answer }]);
                });

                const answersText = answers.map((answer, index) => `**${filter[0].questions[index]}**\n\`\`\`${answer.split('> ')[1]}\`\`\``).join('\n');

                const ticketChannel = await createTicket(client, interaction, client.config.tickets['instant-category'][interaction.guild.id], filter, category, answersText);

                if (ticketChannel) {
                    await sendNewEmbedWithQuestions(client, ticketChannel, filter[0], answersText);
                } else {
                    console.error('Ticket channel is undefined');
                }
            }
        } catch (error) {
            console.error('Error handling ticket questions:', error);
            interaction.reply({ content: 'An error occurred while processing your answers. Please try again later.', ephemeral: true }).catch(err => console.error('Error replying with failure message:', err));
        }
    }
}

async function sendNewEmbedWithQuestions(client, ticketChannel, category, answersText) {
    const newEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
        .setTitle('Ticket Details')
        .setDescription(`**Category:** ${category.name}\n\n${answersText}`)
        .setTimestamp();

    try {
        await ticketChannel.send({ embeds: [newEmbed] });
    } catch (error) {
        console.error('Error posting new embed with questions:', error);
    }
}
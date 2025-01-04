const { EmbedBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'select-ticket-setting',
        description: 'When the user wants to change something from the ticket settings'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the ticket settings has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'ticket-category':
                const ticketCategoryEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select an action`)
                .setDescription(`Please select an action from the select menu below`)
                .setTimestamp();

                const ticketCategorySelect = new StringSelectMenuBuilder()
                .setCustomId(`select-action-ticket-category`)
                .setPlaceholder(`No action selected`)
                .setOptions([{
                    label: 'Add',
                    value: 'add',
                    description: 'Add a ticket category (max 9)'
                }, {
                    label: 'Remove',
                    value: 'remove',
                    description: 'Remove a ticket category'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const ticketCategoryActionRow = new ActionRowBuilder().addComponents(ticketCategorySelect);

                interaction.update({embeds: [ticketCategoryEmbed], components: [ticketCategoryActionRow]}).catch(err => {});
                break;
            case 'tickets-amount':
                const ticketAmountInput = new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setLabel(`Provide the max amount of open tickets`)
                .setPlaceholder(`No amount provided`)
                .setMaxLength(2)
                .setMinLength(1)
                .setRequired(true)
                .setCustomId(`amount`);

                const ticketAmountActionRow = new ActionRowBuilder().addComponents(ticketAmountInput);
                
                const ticketModal = new ModalBuilder()
                .setCustomId(`ticket-amount-change`)
                .setTitle(`Amount of open tickets`)
                .addComponents(ticketAmountActionRow);

                interaction.showModal(ticketModal).catch(console.log);
                break;
            case 'ticket-category-type':
                const categoryOptions = new StringSelectMenuBuilder()
                .setCustomId(`ticket-category-type-change`)
                .setPlaceholder(`No category type selected`)
                .setOptions([{
                    label: `Buttons${client.config.tickets.categoryType[interaction.guild.id] === "BUTTONS" ? ` (currently enabled)` : ``}`,
                    value: 'buttons',
                    description: 'Users will have to click a button to select a category'
                }, {
                    label: `Select menu${client.config.tickets.categoryType[interaction.guild.id] === "MENU" ? ` (currently enabled)` : ``}`,
                    value: 'menu',
                    description: 'Users will have to select a category from a select menu'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this option'
                }]);

                const changeCategoryActionRow = new ActionRowBuilder().addComponents(categoryOptions);

                const selectEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select a category type`)
                .setDescription(`Select a category type to change the current category type`)
                .setTimestamp();

                interaction.update({embeds: [selectEmbed], components: [changeCategoryActionRow]}).catch(err => {});
                break;
            case 'ticket-transcript-dm':
                client.config.tickets.dm[interaction.guild.id] = !client.config.tickets.dm[interaction.guild.id];
                configHandler(client, client.config);
                
                const ticketTranscriptDM = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Ticket transcript DM ${client.config.tickets.dm[interaction.guild.id] === true ? 'enabled' : 'disabled'}`)
                .setDescription(`Users ${client.config.tickets.dm[interaction.guild.id] === true ? 'will now receive ' : "won't receive "} a transcript of their ticket in their DM${client.config.tickets.dm[interaction.guild.id] === false ? ' anymore' : ''}`)
                .setTimestamp();

                interaction.update({embeds: [ticketTranscriptDM], components: []}).catch(err => {});
                break;
            case 'ticket-claim-system':
                client.config.tickets['claim-system'][interaction.guild.id] = !client.config.tickets['claim-system'][interaction.guild.id];
                configHandler(client, client.config);
                
                const ticketClaimSystem = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Ticket claim system ${client.config.tickets['claim-system'][interaction.guild.id] === true ? 'enabled' : 'disabled'}`)
                .setDescription(`The claim system has successfully been ${client.config.tickets['claim-system'][interaction.guild.id] === true ? 'enabled' : "disabled"}.`)
                .setTimestamp();

                interaction.update({embeds: [ticketClaimSystem], components: []}).catch(err => {});
                break;
            case 'instant-category':
                client.config.tickets['instant-category'][interaction.guild.id] = !client.config.tickets['instant-category'][interaction.guild.id];
                configHandler(client, client.config);
                
                const instantCategorySystem = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Instant category system ${client.config.tickets['instant-category'][interaction.guild.id] === true ? 'enabled' : 'disabled'}`)
                .setDescription(`${client.config.tickets['instant-category'][interaction.guild.id] === true ? 'Members will now be able to instantly create a ticket with a ticket category.' : 'Members will now have to select a ticket category inside their ticket.'} Make sure to update the ticket creation embed.`)
                .setTimestamp();

                interaction.update({embeds: [instantCategorySystem], components: []}).catch(err => {});
                break;
            case 'tag-support':
                client.config.tickets['tag-support'][interaction.guild.id] = !client.config.tickets['tag-support'][interaction.guild.id];
                configHandler(client, client.config);
                
                const tagTicketSupport = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Tag support ${client.config.tickets['tag-support'][interaction.guild.id] === true ? 'enabled' : 'disabled'}`)
                .setDescription(`The ticket support roles will ${client.config.tickets['tag-support'][interaction.guild.id] === true ? 'be tagged from now' : 'not be tagged anymore'}.`)
                .setTimestamp();

                interaction.update({embeds: [tagTicketSupport], components: []}).catch(err => {});
                break;
            case 'ticket-questions':
                const getTicketCategories = client.deepCopy(client.globals.get('ticket-categories') ?? {})[interaction.guild.id] ?? [];

                const noTicketCategories = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('No ticket categories')
                .setDescription('No ticket categories have been set and therefore no questions can be added or removed to a ticket category.')
                .setTimestamp();

                if(getTicketCategories.length === 0) return interaction.update({embeds: [noTicketCategories], components: []}).catch(err => {});

                const selectCategory = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select a ticket category`)
                .setDescription(`Select one of the ticket categories in the select menu below to manage the questions of the selected ticket category.`)
                .setTimestamp();

                const ticketCategories = new StringSelectMenuBuilder()
                .setCustomId('select-ticket-category-questions')
                .setPlaceholder('No category selected')
                .setOptions([...getTicketCategories.map((t, i) => {
                    return {
                        label: t.name,
                        value: `i-${i}`,
                        description: `Manage questions for the ${t.name} category`
                    }
                }), {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const actionRow = new ActionRowBuilder().addComponents(ticketCategories);

                interaction.update({embeds: [selectCategory], components: [actionRow]}).catch(err => {});
                break;
            case 'auto-tag':
                const autoTagEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select auto tag type`)
                .setDescription(`Please select the auto tag type you would like to enable for the tickets in the select menu below.`)
                .setTimestamp();

                const autoTagMenu = new StringSelectMenuBuilder()
                .setCustomId('select-auto-tag-option')
                .setPlaceholder('No auto tag option selected')
                .setOptions([{
                    label: `Member${client.config.tickets['auto-tag'][interaction.guild.id] === "MEMBER" ? " (enabled)" : ""}`,
                    value: 'member',
                    description: 'Tag the member who opened the ticket after each reply'
                }, {
                    label: `Staff${client.config.tickets['auto-tag'][interaction.guild.id] === "STAFF" ? " (enabled)" : ""}`,
                    value: 'staff',
                    description: 'Tag the staff after each reply of the member who opened the ticket'
                }, {
                    label: `All${client.config.tickets['auto-tag'][interaction.guild.id] === "ALL" ? " (enabled)" : ""}`,
                    value: 'all',
                    description: 'Tag both the staff and the member who opened the ticket after each reply'
                }, {
                    label: `Preference${client.config.tickets['auto-tag'][interaction.guild.id] === "PREFERENCE" ? " (enabled)" : ""}`,
                    value: 'preference',
                    description: 'Tag the staff or the member who opened the ticket after each reply based on their preferences'
                }, {
                    label: `Disable${client.config.tickets['auto-tag'][interaction.guild.id] === false ? ` (Already disabled)` : ``}`,
                    value: `disable`,
                    description: 'Disable the auto tag feature'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const autoTagActionRow = new ActionRowBuilder().addComponents(autoTagMenu);

                interaction.update({embeds: [autoTagEmbed], components: [autoTagActionRow]}).catch(err => {});
                break;
        }
    }
}
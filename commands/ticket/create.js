const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

function firstUpperCase(string){
    var firstLetter = string.slice(0, 1).toUpperCase();
    var newString = firstLetter + string.slice(1, string.length);
    return newString;
}

module.exports = {
    data: {
        name: 'ticket',
        description: 'Create a ticket message for people to create a ticket',
        category: 'Tickets',
        options: [],
        defaultEnabled: false,
        permissions: 'ManageMessages',
        visible: true
    },
    run: function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        var sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-create'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-create'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        let emptyCategory = {};
        emptyCategory[message.guild.id] = [];
        const categories = client.deepCopy((client.globals.get(`ticket-categories`) || emptyCategory));

        if(client.config.tickets['instant-category'][message.guild.id] && categories[message.guild.id].length > 0){
            const openEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets['instant-category'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets['instant-category'].message))
            .setTimestamp();

            if(typeof messages.tickets['instant-category'].image === 'string'){
                openEmbed.setImage(messages.tickets['instant-category'].image);
            }

            if(client.config.tickets.categoryType[message.guild.id] === "BUTTONS"){
                const actionRows = [];
                const buttons = [[]];

                for(var i = 0; i < categories[message.guild.id].length; i++){
                    var category = categories[message.guild.id][i];
                    var btnArr = buttons[buttons.length - 1];
                    if(btnArr.length === 5){
                        buttons.push([]);
                        btnArr = buttons[buttons.length - 1];
                    }
                    const categoryButton = new ButtonBuilder()
                    .setStyle(ButtonStyle[firstUpperCase(category.color)])
                    .setLabel(category.name)
                    .setCustomId(`ticket-category-select__${category.name.toLowerCase().split(' ').join('-')}`);
                    if(typeof category.emote === 'string'){
                        categoryButton.setEmoji(category.emote);
                    }
                    btnArr.push(categoryButton);
                }

                for(var i = 0; i < buttons.length; i++){
                    var btns = buttons[i];
                    actionRows.push(new ActionRowBuilder().addComponents(...btns));
                }

                const confirmCreated = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['created-ticket-message'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['created-ticket-message'].message))
                .setTimestamp();

                if(interaction === true) message.reply(client.handleContent(message, {embeds: [confirmCreated], ephemeral: true})).catch(err => {});

                sendMessage = client.sendMessage(message, false);

                sendMessage({embeds: [openEmbed], components: [...actionRows]}).then(async msg => {
                    if(interaction === false) message.delete().catch(err => {});
                }).catch(err => {});
            } else if(client.config.tickets.categoryType[message.guild.id] === "MENU"){
                const selectMenu = new StringSelectMenuBuilder()
                .setPlaceholder(`No category selected`)
                .setCustomId('ticket-category-select')
                .setOptions([...categories[message.guild.id].map(c => {
                    let obj = {label: c.name, value: c.name.toLowerCase().split(' ').join('-')};
                    if(typeof c.emote === 'string'){
                        obj['emoji'] = c.emote;
                    }
                    return obj;
                })]);

                const selectMenuActionRow = new ActionRowBuilder().addComponents(selectMenu);

                const confirmCreated = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['created-ticket-message'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['created-ticket-message'].message))
                .setTimestamp();

                if(interaction === true) message.reply(client.handleContent(message, {embeds: [confirmCreated], ephemeral: true})).catch(err => {});

                sendMessage = client.sendMessage(message, false);

                sendMessage({embeds: [openEmbed], components: [selectMenuActionRow]}).then(async msg => {
                    if(interaction === false) message.delete().catch(err => {});
                }).catch(err => {});
            }
        } else {
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setCustomId(`ticket-button`)
                .setStyle(ButtonStyle.Primary)
                .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.embed.button))
            );
            const openTicket = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.embed.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.embed.message))
            .setTimestamp();

            if(typeof messages.tickets.embed.image === 'string'){
                openTicket.setImage(messages.tickets.embed.image);
            }

            const confirmCreated = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['created-ticket-message'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['created-ticket-message'].message))
            .setTimestamp();

            if(interaction === true) message.reply(client.handleContent(message, {embeds: [confirmCreated], ephemeral: true})).catch(err => {});

            sendMessage = client.sendMessage(message, false);

            sendMessage({embeds: [openTicket], components: [actionRow]}).then(async msg => {
                if(interaction === false) message.delete().catch(err => {});
            }).catch(err => {});
        }
    }
};
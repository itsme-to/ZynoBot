const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, PermissionsBitField, ButtonStyle } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");

module.exports = {
    data: {
        name: 'embed',
        description: 'Create an embed with the embed builder',
        options: [],
        category: 'Moderation',
        defaultEnabled: false,
        permissions: 'ManageMessages',
        visible: true
    },
    run: function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const buttonTypes = [{
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.title),
                "value": "title"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.description),
                "value": "description"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.url),
                "value": "url"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.thumbnail),
                "value": "thumbnail"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.image),
                "value": "image"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons["author text"]),
                "value": "author text"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons["author image"]),
                "value": "author image"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.color),
                "value": "color"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons["footer text"]),
                "value": "footer text"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons["footer image"]),
                "value": "footer image"
            }, {
                "name": handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.timestamp),
                "value": "timestamp"
            }
        ];

        const buttons = buttonTypes.reduce((array, buttonType) => {
            const btn = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`embed-builder__${message.member.id}-${buttonType.value.toLowerCase()}`)
            .setLabel(`${handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons["set-text"])} ${buttonType.name.toLowerCase()}`);

            array.push(btn);
            return array;
        }, []);

        buttons.push(new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`embed-builder__${message.member.id}-cancel`)
        .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.cancel)))
        buttons.push(new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setCustomId(`embed-builder__${message.member.id}-send`)
        .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].buttons.send)));

        const actionRows = [[]];
        for(var i = 0; i < buttons.length; i++){
            var lastIndex = actionRows.length - 1;
            if(actionRows[lastIndex].length >= 5){
                actionRows.push([buttons[i]]);
            } else {
                actionRows[lastIndex].push(buttons[i]);
            }
        }

        const embedBuilder = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.embed["embed-build"].message))
        .setTimestamp();

        client.interactionActions.set(`embed-builder-${message.member.id}-${message.guild.id}`, {});

        sendMessage({embeds: [embedBuilder], components: actionRows.map(a => new ActionRowBuilder().addComponents(a))}).catch(err => {});
    }
}
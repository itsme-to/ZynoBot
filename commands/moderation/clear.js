const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'clear',
        description: 'Clear an amount of messages from a specific channel',
        category: 'Moderation',
        options: [{type: 10, name: 'amount', description: 'The amount of messages you want to clear', required: true}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noAmount = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['error-messages']['no-amount'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['error-messages']['no-amount'].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noAmount]}).catch(err => {});

        const invalidAmount = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['error-messages']['invalid-number'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['error-messages']['invalid-number'].message))
        .setTimestamp();

        if(!Number(args[1])) return sendMessage({embeds: [invalidAmount]}).catch(err => {});
        if(Number(args[1]) < 1 || Number(args[2]) > 99) return sendMessage({embeds: [invalidAmount]}).catch(err => {});

        const cleaRed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['success'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['success'].message, [{MESSAGES: args[1]}]))
        .setTimestamp();

        const failed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['error-messages'].error.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.clear['error-messages'].error.message, [{MESSAGES: args[1]}]))
        .setTimestamp();

        var amount = interaction === false ? Number(args[1]) + 1 : Number(args[1]);

        message.channel.bulkDelete(amount).then(() => {
            setTimeout(function(){
                sendMessage({embeds: [cleaRed]}).catch(err => {});
            }, 500);
        }).catch(err => {
            setTimeout(function(){
                sendMessage({embeds: [failed]}).catch(err => {});
            }, 500);

            console.log(`Error while clearing ${message.channel.name}: `, err);
        });
    }
}
const { EmbedBuilder, Team, User } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'username',
        description: 'Change the username of the bot',
        category: 'Bot',
        options: [{type: 3, name: 'username', description: 'The new username of the bot', required: true}],
        defaultEnabled: true,
        permissions: 'Administrator',
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-username'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-username'].message, [{PERMISSIONS: 'Owner'}]))
        .setTimestamp();

        if(message.member.id !== client.application.ownerId){
            if(client.application.owner instanceof User){
                if(client.application.owner.id !== message.member.id){
                    return sendMessage({embeds: [noPerms]}).catch(err => {});
                }
            } else if(client.application.owner instanceof Team) {
                if(!client.application.owner.members.get(message.member.id)){
                    return sendMessage({embeds: [noPerms]}).catch(err => {});
                }
            } else {
                return sendMessage({embeds: [noPerms]}).catch(err => {});
            }
        }

        const noName = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-username-provided'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-username-provided'].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noName]}).catch(err => {});

        var username = args.slice(1).join(" ").split("`").join("");

        const failed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-username'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-username'].message))
        .setTimestamp();

        const success = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['username-updated'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['username-updated'].message, [{USERNAME: username}]))
        .setTimestamp();

        client.user.setUsername(username).then(() => {
            sendMessage({embeds: [success]}).catch(err => {});
        }).catch(err => {
            console.log(`Error while trying to change the username of the bot: `, err);
            sendMessage({embeds: [failed]}).catch(err => {});
        });
    }
}
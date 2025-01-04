const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions.js');

module.exports = {
    data: {
        name: 'poll end',
        description: 'End a poll',
        options: [{type: 3, name: 'message-id', description: 'The message id of the poll', required: true}],
        category: 'Polls',
        defaultEnabled: false,
        permissions: 'ManageMessages',
        visible: true,
        subCommand: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get((args[0]+' '+args[1]).toLowerCase());
        
        var replyMessage = null;

        function sendMessage(content){
            return new Promise((resolve, reject) => {
                if(interaction === false){
                    message.channel.send(client.handleContent(message, content)).then(resolve).catch(reject);
                } else {
                    var newContent = content;
                    newContent['fetchReply'] = true;
                    if(replyMessage === null) message.reply(client.handleContent(message, newContent)).then(resolve).catch(reject);
                    else replyMessage.edit(client.handleContent(message, newContent)).then(resolve).catch(reject);
                }
            });
        }

        if(interaction === true){
            const loadingEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end.loading.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end.loading.message))
            .setTimestamp();

            try{
                replyMessage = await message.reply(client.handleContent(message, {embeds: [loadingEmbed]}));
            } catch {}
            await wait(400);
        }

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end["no-permissions"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end["no-permissions"].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const missingArguments = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end['missing-arguments'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end['missing-arguments'].message, [{PREFIX: client.config.prefix}]))
        .setTimestamp();

        if(!args[2]) return sendMessage({embeds: [missingArguments]}).catch(err => {});
        if(args[2].length > 40) return;

        const notExists = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end['not-exist'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end['not-exist'].message, [{MESSAGE: args[2]}]))
        .setTimestamp();

        let info = client.polls.get(args[2]);
        if(!info) return sendMessage({embeds: [notExists]}).catch(err => {});
        info = client.deepCopy(info);

        const endedPoll = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end['success'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.end['success'].message, [{MESSAGE: args[2]}]))
        .setTimestamp();

        try {
            await client.pollHandler.endPoll(client, info);
            sendMessage({embeds: [endedPoll]}).catch(err => {});
        } catch {}
    }
};
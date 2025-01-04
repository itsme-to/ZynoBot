const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require("../../functions.js");

module.exports = {
    data: {
        name: 'giveaway delete',
        description: 'Delete a giveaway',
        options: [{type: 3, name: 'message-id', description: 'The message id of the giveaway', required: true}],
        category: 'Giveaway',
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
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete.loading.title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete.loading.message))
            .setTimestamp();

            try{
                replyMessage = await message.reply(client.handleContent(message, {embeds: [loadingEmbed]}));
            } catch {}
            await wait(400);
        }

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete["no-permissions"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete["no-permissions"].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const missingArguments = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete['missing-arguments'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete['missing-arguments'].message, [{PREFIX: client.config.prefix}]))
        .setTimestamp();

        if(!args[2]) return sendMessage({embeds: [missingArguments]}).catch(err => {});
        if(args[2].length > 40) return;

        const notExists = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete['not-exist'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete['not-exist'].message, [{MESSAGE: args[2]}]))
        .setTimestamp();

        const deleted = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete['success'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.delete['success'].message, [{MESSAGE: args[2]}]))
        .setTimestamp();

        try {
            await client.giveawayHandler.delete(args[2]);
            sendMessage({embeds: [deleted]}).catch(err => {});
        } catch (err) {
            console.log(err);
            sendMessage({embeds: [notExists]}).catch(err => {});
        }
    }
};
const { EmbedBuilder, Team, User } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const https = require('https');
const http = require('http');
const types = {https, http};
const { URL } = require('url');

const validateURL = (url) => {
    try {
        return new URL(url);
    } catch {
        return false;
    }
}

module.exports = {
    data: {
        name: 'botavatar',
        description: 'Change the avatar of the bot',
        category: 'Bot',
        options: [{type: 3, name: 'url', description: 'The url of the avatar image', required: true}],
        defaultEnabled: true,
        permissions: 'Administrator',
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-avatar'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-avatar'].message, [{PERMISSIONS: 'Owner'}]))
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-avatar-provided'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-avatar-provided'].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noName]}).catch(err => {});

        var avatar = args.slice(1).join(" ");

        const url = validateURL(avatar);
        
        const invalidURL = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['invalid-url'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['invalid-url'].message))
        .setTimestamp();

        if(!url) return sendMessage({embeds: [invalidURL]}).catch(err => {});

        const protocolType = url.protocol.split(':')[0];
        
        message.deferReply().catch(err => {});

        new Promise((resolve, reject) => {
            const req = types[protocolType].request({
                host: url.hostname,
                path: url.pathname + url.search,
                method: 'GET',
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36.0 (KHTML, like Gecko) Chrome/61.0.0.0 Safari/537.36.0',
                    'accept-language': 'en-US,en-IN;q=0.9,en;q=0.8,hi;q=0.7'
                }
            }, res => {
                if(res.statusCode !== 200 && res.statusCode !== 206) return reject(`Invalid URL`);
                if(!res.headers['content-type'].startsWith('image/')) return reject(`URL is not an image`);

                res.on('error', error => {
                    reject(error);
                });

                resolve();
            });

            req.on('error', error => {
                reject(error);
            });

            req.end();
        }).then(() => {
            client.user.setAvatar(url.toString()).then(() => {
                const success = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['avatar-updated'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['avatar-updated'].message, [{AVATAR: `[${avatar}](${avatar})`}]))
                .setTimestamp();

                message.editReply(client.handleContent(message, {embeds: [success]})).catch(err = {});
            }).catch(err => {
                const failed = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-avatar'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-avatar'].message))
                .setTimestamp();

                message.editReply(client.handleContent(message, {embeds: [failed]})).catch(err = {});

                console.log(`Error while trying to update the bot's avatar: `, err);
            })
        }).catch(err => {
            const failed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-avatar-2'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-avatar-2'].message, [{ERROR: err}]))
            .setTimestamp();
            
            message.editReply(client.handleContent(message, {embeds: [failed]})).catch(err = {});
        });
    }
}
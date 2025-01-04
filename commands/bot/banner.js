const { EmbedBuilder, Team, User } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const https = require('https');
const http = require('http');
const types = {https, http};
const { URL } = require('url');
const { wait } = require('../../functions.js');

const validateURL = (url) => {
    try {
        return new URL(url);
    } catch {
        return false;
    }
}

module.exports = {
    data: {
        name: 'botbanner',
        description: 'Change the banner of the bot',
        category: 'Bot',
        options: [{type: 3, name: 'url', description: 'The url of the banner image', required: true}],
        defaultEnabled: true,
        permissions: 'Administrator',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-banner'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-banner'].message, [{PERMISSIONS: 'Owner'}]))
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

        const noBanner = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-banner-provided'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-banner-provided'].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noBanner]}).catch(err => {});

        var banner = args.slice(1).join(" ");

        const url = validateURL(banner);
        
        const invalidURL = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['invalid-url-banner'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['invalid-url-banner'].message))
        .setTimestamp();

        if(!url) return sendMessage({embeds: [invalidURL]}).catch(err => {});

        const protocolType = url.protocol.split(':')[0];
        
        if(interaction){
            try{
                await message.deferReply();
                await wait(4e2);
            } catch {}
        }

        let bannerImage = [];

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
                const validContentTypes = ['image/png', 'image/jpeg', 'image/gif'];
                if(validContentTypes.indexOf(res.headers['content-type']) < 0) return reject(`URL is not an image`);

                res.on('error', error => {
                    reject(error);
                });

                res.on('data', d => {
                    bannerImage.push(Buffer.from(d));
                });

                res.on('end', () => {
                    resolve(res.headers['content-type']);
                });
            });

            req.on('error', error => {
                reject(error);
            });

            req.end();
        }).then(contentType => {

            let bannerImageBuffer = Buffer.concat(bannerImage);

            const dataImage = `data:${contentType};base64,${bannerImageBuffer.toString('base64')}`;

            client.user.setBanner(dataImage).then(() => {
                const updated = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['banner-updated'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['banner-updated'].message, [{BANNER: banner}]))
                .setTimestamp();
                
                if(interaction) message.editReply(client.handleContent(message, {embeds: [updated]})).catch(err = {});
                else sendMessage({embeds: [updated]}).catch(err => {});
            }).catch(err => {
                if(client.config.debugger) console.log(err);

                const failed = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-banner'].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-banner'].message, [{ERROR: err}]))
                .setTimestamp();
                
                if(interaction) message.editReply(client.handleContent(message, {embeds: [failed]})).catch(err = {});
                else sendMessage({embeds: [failed]}).catch(err => {});
            });
        }).catch(err => {
            const failed = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-banner'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['error-banner'].message, [{ERROR: err}]))
            .setTimestamp();
            
            if(interaction) message.editReply(client.handleContent(message, {embeds: [failed]})).catch(err = {});
            else sendMessage({embeds: [failed]}).catch(err => {});
        });
    }
}
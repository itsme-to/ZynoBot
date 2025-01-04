const { EmbedBuilder } = require('discord.js');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const dns = require('dns');
const { promisify } = require('util');
const reqTypes = {https, http};
const endpoints = [{url: 'https://nekos.life/api/v2/img/slap', identifier: 'url'}, {url: 'https://api.waifu.pics/sfw/slap', identifier: 'url'}];
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

function request(url){
    return new Promise(async (resolve, reject) => {
        var parsed = new URL(url);

        var protocol = parsed.protocol.split(':')[0].toLowerCase();

        const lookup = promisify(dns.lookup);
        const reqType = reqTypes[protocol];

        var family = 4;
        try{
            var getLookup = await lookup(parsed.hostname, {
                hints: 0
            });
            family = getLookup.family || 4;
        } catch {
            family = 4;
        }

        const req = reqType.request({
            host: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: {},
            family: family
        }, res => {
            const response = [];
            res.on('data', d => {
                response.push(d);
            });

            res.on('end', () => {
                resolve(response.join(''));
            });

            res.on('error', err => {
                reject(err);
            });
        });

        req.on('error', err => {
            reject(err);
        });

        req.end();
    });
}

module.exports = {
    data: {
        name: 'slap',
        description: 'Slap someone',
        category: 'Fun',
        options: [{type: 6, name: 'user', description: 'The user you would like to slap', required: true}],
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noMention = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.slap['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.slap['no-mention'].message))
        .setTimestamp();

        var user;
        if(interaction === false){
            if(!message.mentions.members.first()) return sendMessage({embeds: [noMention]}).catch(err => {});
            user = message.mentions.members.first().user;
        } else {
            user = message.options.getUser('user');
        }

        const unknownError = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.slap['unknown-error'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.slap['unknown-error'].message))
        .setTimestamp();

        const endPoint = endpoints[Math.round(Math.random() * (endpoints.length - 1))];

        const slapEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.fun.slap.slap.title))
        .setTimestamp();

        if(typeof endPoint.identifier !== 'string'){
            slapEmbed.setImage(endPoint.url);
            sendMessage({embeds: [slapEmbed]}).catch(err => {});
        } else {
            request(endPoint.url).then(res => {
                var obj;
                try{
                    obj = JSON.parse(res);
                } catch {
                    sendMessage({embeds: [unknownError]}).catch(err => {});
                    return;
                }
                slapEmbed.setImage(obj[endPoint.identifier]);
                sendMessage({embeds: [slapEmbed]}).catch(err => {});
            }).catch(err => {
                console.log(`Error while getting slap image: `, err);
                sendMessage({embeds: [unknownError]}).catch(err => {});
            });
        }
    }
}
const { EmbedBuilder, AttachmentBuilder, TextChannel, Collection, User, InteractionType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const util = require('util');
const jsdom = require('jsdom').JSDOM;
const https = require('https');
const http = require('http');
const { URL } = require('url');
const reqTypes = {http: http, https: https};
const { saveTemporary } = require("../../functions.js");
const messages = require('../../messages.json');
const messageHandler = require('../../handlers/handleMessages.js');
const handleMessages = require('../../handlers/handleMessages.js');
const Graphime = require('grapheme-splitter')
const dom = new jsdom();
const document = dom.window.document;
const wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const unlink = util.promisify(fs.unlink);

function parseURL(url){
    try{
        let parsed = new URL(url);
        if(parsed.hostname.length === 0) return false;
        else return parsed;
    } catch {
        return false;
    }
}

function getFileSize(size){
    if(size < 1000){
        return `${size} bytes`;
    } else if(size < 1000000){
        return `${size / 1000} kb`;
    } else {
        return `${size / 1000000} mb`;
    }
}

const splitter = new Graphime();

function Encode(string) { 
    let a = [];

    let splitted = splitter.splitGraphemes(string);

    let skipCharCodes = ['[', ']', '(', ')', ' ', ':', '.', ',', '/', '-', '\n'].map(c => c.charCodeAt());

    for (let word of splitted) {
        let iC = word.charCodeAt();
        if(/^\p{Emoji}*$/u.test(word)){
            a.push(word);
            continue;
        }
        if (((iC < 65 || iC > 127) || (iC > 90 && iC < 97)) && skipCharCodes.indexOf(iC) < 0) { 
            a.push('&#' + iC + ';'); 
        } else { 
            a.push(word); 
        } 
    }
    return a.join(''); 
}

function getContent(string){
    if(string.length === 0) return string;
    let newString = string.toString();

    newString = newString.split("\n");
    let getDecoded = newString;
    for(let i = 0; i < getDecoded.length; i++){
        let newStringIndex = newString.indexOf(getDecoded[i]);
        let decodedLine = getDecoded[i];
        let copyDecodedLine = decodedLine;
        let updatedStr = "";
        let ignoredChars = [];
        if(copyDecodedLine.slice(0, 2) === "> "){
            updatedStr += "> ";
            copyDecodedLine = copyDecodedLine.slice(2);
        }
        let ignoreRegEx = /<(@!|@&|#|@)[0-9]{10,20}>|\*{2}[^*]+\*{2}|\*[^*]+\*|_{2}[^_]+_{2}|_[^_]+_|\`{3}[^\`]*|\`[^\`]+\`|\[(.+)\]\((.+)\)/g;
        ignoredChars = copyDecodedLine.match(ignoreRegEx) ?? [];
        copyDecodedLine = [copyDecodedLine];
        for(let ignoredChar of ignoredChars){
            let findStr = copyDecodedLine.filter(s => s.indexOf(ignoredChar) >= 0);
            for(let str of findStr){
                let stringIndex = copyDecodedLine.indexOf(str);
                if(stringIndex >= 0) copyDecodedLine.splice(stringIndex, 1, ...str.split(ignoredChar));
            }
        }
        for(let z = 0; z < copyDecodedLine.length; z++){
            let decodedString = copyDecodedLine[z];
            let splitDecoded = decodedString.split(" ").filter(s => /^(https?:\/\/)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,24}(\/.*)?$/.test(s));
            decodedString = [decodedString];
            for(let url of splitDecoded){
                let findURL = decodedString.filter(s => s.indexOf(url) >= 0);
                for(let found of findURL){
                    let foundIndex = decodedString.indexOf(found);
                    if(foundIndex >= 0) decodedString.splice(foundIndex, 1, ...found.split(url))
                }
            }
            decodedString = decodedString.map(v => Encode(v));
            for(let x = 0; x < splitDecoded.length; x++){
                decodedString.splice(x + 1*(x + 1), 0, splitDecoded[x]);
            }
            copyDecodedLine[z] = decodedString.join('');
        }
        for(let z = 0; z < ignoredChars.length; z++){
            copyDecodedLine.splice(z + 1*(z + 1), 0, ignoredChars[z]);
        }
        if(newStringIndex >= 0) newString[newStringIndex] = updatedStr + copyDecodedLine.join('');
    }
    newString = newString.join("\n");

    while(newString.indexOf('> ') >= 0 && [undefined, '\n'].includes(newString[newString.indexOf('> ') - 1])){
        let seperate = newString.split('> ');
        newString = newString.split(`> ${seperate[1].split('\n')[0]}`).join(`<span class='quote'>${Encode(seperate[1].split('\n')[0])}</span>`);
    }
    while(newString.indexOf('```') >= 0 && newString.indexOf('```') <= newString.lastIndexOf('```') - 4 && [' ', undefined, '\n'].includes(newString[newString.indexOf('```') - 1])){
        let seperate = newString.split('```');
        newString = newString.split('```'+seperate[1]+'```').join('<span class="textfield">'+Encode(seperate[1])+'</span>');
    }
    while(newString.indexOf('`') >= 0 && newString.indexOf('`') <= newString.lastIndexOf('`') - 2 && [' ', undefined, '\n'].includes(newString[newString.indexOf('`') - 1])){
        let seperate = newString.split('`');
        newString = newString.split('`'+seperate[1]+'`').join(`<code>${Encode(seperate[1])}</code>`);
    }
    while(newString.indexOf('**') >= 0 && newString.indexOf('**') <= newString.lastIndexOf('**') - 3 && [' ', undefined, '\n'].includes(newString[newString.indexOf('**') - 1])){
        let seperate = newString.split('**');
        newString = newString.split('**'+seperate[1]+'**').join(`<b>${Encode(seperate[1])}</b>`)
    }
    while(newString.indexOf('*') >= 0 && newString.indexOf('*') <= newString.lastIndexOf('*') - 2 && [' ', undefined, '\n'].includes(newString[newString.indexOf('*') - 1])){
        let seperate = newString.split('*');
        newString = newString.split('*'+seperate[1]+'*').join(`<i>${Encode(seperate[1])}</i>`)
    }
    while(newString.indexOf('__') >= 0 && newString.indexOf('__') <= newString.lastIndexOf('__') - 3 && [' ', undefined, '\n'].includes(newString[newString.indexOf('__') - 1])){
        let seperate = newString.split('__');
        newString = newString.split('__'+seperate[1]+'__').join('<u>'+Encode(seperate[1])+'</u>');
    }
    while(newString.indexOf('_') >= 0 && newString.indexOf('_') <= newString.lastIndexOf('_') - 2 && [' ', undefined, '\n'].includes(newString[newString.indexOf('_') - 1])){
        let seperate = newString.split('_');
        newString = newString.split('_'+seperate[1]+'_').join('<i>'+Encode(seperate[1])+'</i>');
    }
    let args = newString.split(" ");
    args.filter(a => {
        if((a.toLowerCase().startsWith("https://") || a.toLowerCase().startsWith("http://")) && a.indexOf('.') >= 0){
            if(a.lastIndexOf('/') >= "https://".length){
                let getExtension = a.split('://').slice(1).join('://').split('/')[0].split('.');
                if(getExtension[getExtension.length - 1].length < 64){
                    return true;
                } else {
                    return false;
                }
            } else {
                let extension = a.slice(a.lastIndexOf('.') + 1);
                if(extension.length < 64){
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
    }).forEach(url => {
        const index = args.indexOf(url);
        if(index >= 0){
            args[index] = `<a href="${url}" target="_blank">${Encode(url)}</a>`;
        }
    });
    newString = args.join(" ");
    
    newString = newString.split('\n').join("<br>");

    return newString;
}

function getURLS(string){
    if(string.length === 0) return string;
    let newString = "";

    while(string.indexOf('](') >= 0 && string.indexOf('[') >= 0 && string.indexOf(')') >= 0 && string.indexOf('[') < string.indexOf('](') && string.slice(string.indexOf('](') + 1).indexOf(')') + string.indexOf('](') > string.indexOf('](')){
        let seperate = string.split('](');
        let url = seperate[1].split(')')[0];
        let text = seperate[0].split('[');
        let textCopy = [...text];
        textCopy.shift();
        let start = textCopy.filter(t => t.indexOf(']') < 0)[0];
        if(!start){
            text = text[text.length - 1];
        } else {
            let startIndex = text.indexOf(start);
            text = text.slice(startIndex).join('[');
        }
        newString += string.split(`[${text}](${url})`)[0]+`<a href="${url}" target="_blank">${text}</a>`;
        string = string.split(`[${text}](${url})`).slice(1).join(`[${text}](${url})`);
    }

    newString += string;
    return newString;
}

async function getMentions(string, client, g){
    let messageContent = string;
    if((string.indexOf("<@!") >= 0 || string.indexOf("<@") >= 0)){
        if(string.indexOf("<@!") >= 0){
            let members = messageContent.split("<@!");
            for(let i = 0; i < members.length; i++){
                let member = members[i];
                if(member.indexOf('>') < 0) continue;
                let id = member.split('>')[0];
                if(!/^[0-9]*$/.test(id)){
                    continue;
                } else {
                    let userMention;
                    const receivedMember = await client.cache.getMember(id, g);
                    if(typeof receivedMember === 'object') userMention = `<span class="mention user">@${Encode(receivedMember.displayName || 'Unknown username')}</span>`;
                    else userMention = `<span class="mention user">@Unknown username</span>`;
                    messageContent = messageContent.split(`<@!${id}>`).join(userMention);
                }
            }
        }
        if(string.indexOf("<@") >= 0){
            let members = messageContent.split("<@");
            for(let i = 0; i < members.length; i++){
                let member = members[i];
                if(member.indexOf('>') < 0) continue;
                let id = member.split('>')[0];
                if(!/^[0-9]*$/.test(id)){
                    continue;
                } else {
                    let userMention;
                    const receivedMember = await client.cache.getMember(id, g);
                    if(typeof receivedMember === 'object') userMention = `<span class="mention user">@${Encode(receivedMember.displayName ?? 'Unknown username')}</span>`;
                    else userMention = `<span class="mention user">@Unknown username</span>`;
                    messageContent = messageContent.split(`<@${id}>`).join(userMention);
                }
            }
        }
    }
    if(string.indexOf('<@&') >= 0){
        let roles = messageContent.split("<@&");
        for(let i = 0; i < roles.length; i++){
            let role = roles[i];
            if(role.indexOf('>') < 0) continue;
            let id = role.split('>')[0];
            if(!/^[0-9]*$/.test(id)){
                continue;
            } else {
                let roleMention;
                const receivedRole = await client.cache.getRole(id, g);
                if(receivedRole) roleMention = `<span style="color: ${receivedRole.hex};">@${Encode(receivedRole.name)}</span>`;
                else roleMention = `<span>@deleted-role</span>`;
                messageContent = messageContent.split(`<@&${id}>`).join(roleMention);
            }
        }
    }
    if(string.indexOf('<#')){
        let channels = messageContent.split("<#");
        for(let i = 0; i < channels.length; i++){
            let channel = channels[i];
            if(channel.indexOf('>') < 0) continue;
            let id = channel.split('>')[0];
            if(!/^[0-9]*$/.test(id)){
                continue;
            } else {
                let channelMention;
                const receivedChannel = await client.cache.getChannel(id, g);
                if(receivedChannel) channelMention = `<span class="mention channel">#${Encode(receivedChannel.name)}</span>`;
                else channelMention = `<span class="mention channel">#deleted-channel</span>`;
                messageContent = messageContent.split(`<#${id}>`).join(channelMention);
            }
        }
    }
    return messageContent;
}

function getHexColor(roles){
    var rolesCache = Array.from(roles.cache.values()).sort((a, b) => b.position - a.position);

    if(rolesCache.length === 0) return `#ffffff`;
    var colorCode = rolesCache[0].color;
    while(colorCode === 0 && rolesCache.length > 0){
        colorCode = rolesCache[0].color;
        rolesCache.shift();
    }
    if(rolesCache.length === 0 && colorCode === 0){
        colorCode = 16777215;
    }
    var colorString = colorCode.toString(16);
    while(colorString.length < 6){
        colorString = '0'+colorString;
    }
    colorString = '#' + colorString;
    return colorString;
}

function getImageBase64(url){
    return new Promise((resolve, reject) => {
        let parsed = parseURL(url);

        if(!parsed) return reject(`Invalid image url`);

        const protocolType = parsed.protocol.split(':')[0].toLowerCase();

        const request = reqTypes[protocolType].request({
            host: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en-IN;q=0.9,en;q=0.8,hi;q=0.7',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'
            }
        }, response => {
            if(response.statusCode >= 300 && response.statusCode < 400){
                if(typeof response.headers.location === 'string' && redirectCount < 3){
                    ++redirectCount;
                    parsed = response.headers.location.startsWith('http') || response.headers.location.startsWith('https') ? parseURL(response.headers.location) : parseURL(path.join(parsed.toString(), response.headers.location));
                    return sendRequest().then(resolve).catch(reject);
                } else if(redirect >= 3){
                    reject('The proxy got redirected too many times');
                    return;
                } else if(typeof response.headers.location === 'string'){
                    reject('The server responded with status code '+response.statusCode+' without a location header');
                    return;
                }
            } else if(response.statusCode >= 400){
                reject('The server responded with status code '+response.statusCode);
                return;
            } else if(!(response.headers['content-type'] ?? '').startsWith('image/')){
                reject('The provided url does not provide a valid image');
                return;
            }

            const chunks = [];

            response.on('error', err => {
                reject(err);
                return;
            });

            response.on('data', chunk => {
                chunks.push(chunk);
            });

            response.on('end', () => {
                resolve({
                    buffer: Buffer.concat(chunks),
                    contentType: response.headers['content-type'] ?? 'image/png'
                });
            });
        });

        request.on('error', err => {
            reject(err);
            return;
        });

        request.end();
    });
}

module.exports = {
    data: {
        id: 'delete-ticket-modal',
        description: `Deletes a closed ticket`
    },
    run: async function(client, interaction, isInteraction){
        let cachedImages = {};
        let cachedImagesArr = [];
        
        try {
            await interaction.deferReply({ ephemeral: true });
        } catch (err) {
            console.error('Error deferring reply:', err);
        }
        
        if (interaction.type !== InteractionType.ModalSubmit && !isInteraction) {
            return;
        }
        
        var ticketFrom = client.tickets.filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(t => typeof t === 'string' ? t === interaction.channel.id : t.channel === interaction.channel.id).length > 0;
            } else if(typeof t.value === 'string'){
                return t.value === interaction.channel.id;
            } else {
                return false;
            }
        });
        var user = null;
        if(ticketFrom.size > 0){
            user = client.users.cache.get(ticketFrom.firstKey());
        } else {
            user = {id: 'unknown user id', username: 'unknown username', tag: 'unknown user tag', user: 'unknown user', send: null};
        }

        let ticketInfo;
        if(ticketFrom.size > 0){
            ticketInfo = client.deepCopy(client.tickets.get(ticketFrom.firstKey()));
        }
        if(typeof ticketInfo === 'string'){
            ticketInfo = {
                channel: ticketInfo,
                claimed: false,
                category: false,
                closed: false,
                guild: interaction.guild.id,
                questions: false,
                autotag: []
            };
        } else if(Array.isArray(ticketInfo)){
            ticketInfo = ticketInfo.filter(t => typeof t === 'string' ? t === interaction.channel.id : t.channel === interaction.channel.id);
            if(ticketInfo.length === 0){
                ticketInfo = {
                    channel: ticketInfo,
                    claimed: false,
                    category: false,
                    closed: false,
                    guild: interaction.guild.id,
                    questions: false,
                    autotag: []
                };
            } else {
                ticketInfo = ticketInfo[0];
                if(typeof ticketInfo === 'string'){
                    ticketInfo = {
                        channel: ticketInfo,
                        claimed: false,
                        category: false,
                        closed: false,
                        guild: interaction.guild.id,
                        questions: false,
                        autotag: []
                    };
                }
            }
        } else {
            ticketInfo = {
                channel: ticketInfo,
                claimed: false,
                category: false,
                closed: false,
                guild: interaction.channel.id,
                questions: false,
                autotag: []
            };
        }
        
        const failedClosing = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(messageHandler(client, interaction.member.user, user, interaction.channel, messages.tickets['close-ticket']['error-messages']['unknown-error'].title))
        .setDescription(messageHandler(client, interaction.member.user, user, interaction.channel, messages.tickets['close-ticket']['error-messages']['unknown-error'].message))
        .setTimestamp();

        let messageCollection = [];
        new Promise(async (resolve, reject) => {
            var channelMessages;
            try{
                channelMessages = await interaction.channel.messages.fetch({after: 0, limit: 100});

                messageCollection.push(channelMessages);

                while(channelMessages.size === 100){
                    let lastMessageId = channelMessages.lastKey();
                    channelMessages = await interaction.channel.messages.fetch({limit: 100, before: lastMessageId});
                    if(channelMessages) messageCollection.push(channelMessages);
                    await wait(400);
                }

                resolve(messageCollection);
            } catch (error) {
                console.log(error);
                reject();
            }
        }).then(collection => {
            let msgs = new Collection();
            for(var i = 0; i < collection.length; i++){
                var collection = collection[i];
                msgs = msgs.concat(collection);
            }
            
            msgs.reverse();
            msgs = msgs.map(m => m);

            var reason = interaction.type === InteractionType.ModalSubmit ? ((interaction.fields.getTextInputValue('reason') ?? '').length > 0 ? interaction.fields.getTextInputValue('reason') : `No reason provided`) : (interaction.type === InteractionType.ApplicationCommand ? (interaction.options.getString('reason') ?? 'No reason provided') : 'No reason provided');

            var ticketOpened = "dd/mm/yy";
            const ticketOpenedDate = new Date(interaction.channel.createdTimestamp);
            ticketOpened = ticketOpened.split("dd").join(ticketOpenedDate.getDate().toString().length > 1 ? ticketOpenedDate.getDate().toString() : `0${ticketOpenedDate.getDate().toString()}`);
            ticketOpened = ticketOpened.split("mm").join((ticketOpenedDate.getMonth() + 1).toString().length > 1 ? (ticketOpenedDate.getMonth() + 1).toString() : `0${(ticketOpenedDate.getMonth() + 1).toString()}`);
            ticketOpened = ticketOpened.split("yy").join(ticketOpenedDate.getFullYear());

            var tickedClosed = "dd/mm/yy";
            const ticketClosedDate = new Date();
            tickedClosed = tickedClosed.split("dd").join(ticketClosedDate.getDate().toString().length > 1 ? ticketClosedDate.getDate().toString() : `0${ticketClosedDate.getDate().toString()}`);
            tickedClosed = tickedClosed.split("mm").join((ticketClosedDate.getMonth() + 1).toString().length > 1 ? (ticketClosedDate.getMonth() + 1).toString() : `0${(ticketClosedDate.getMonth() + 1).toString()}`);
            tickedClosed = tickedClosed.split("yy").join(ticketClosedDate.getFullYear());

            fs.readFile(path.join(__dirname, `../../html/ticket_template.html`), `utf-8`, async (err, html) => {
                if(err) return console.log(err);
                var file = html;
                file = file.split('{TICKET_NAME}').join(interaction.channel.name);
                file = file.split('{OPEN_DATE}').join(`${ticketOpened}`);
                file = file.split('{CLOSE_DATE}').join(tickedClosed);
                file = file.split('{CLOSED_BY}').join(interaction.member.user.username);
                file = file.split('{GUILD_ICON}').join(interaction.guild.iconURL({dynamic: true}));
                file = file.split('{GUILD_NAME}').join(interaction.guild.name);
                file = file.split('{BOT_NAME}').join(client.user.username);
                file = file.split('{TICKET_REASON}').join(reason);

                const parentDiv = document.createElement(`div`);

                for(var i = 0; i < msgs.length; i++){
                    var msg = msgs[i];
                    const div = document.createElement('div');
                    div.classList.add('message');
                    div.innerHTML = ``;
                    if(msg.reference !== null){
                        const referenceMessage = msgs.filter(m => m.id === msg.reference.messageId)[0];
                        if(referenceMessage){
                            const repliedDiv = document.createElement('div');
                            repliedDiv.classList.add(`replied`);
                            repliedDiv.innerHTML = ``;
                            if((referenceMessage.content || '').length > 0){
                                var messageContent = referenceMessage.content;
                                if(messageContent.length > 30) messageContent = messageContent.slice(0, 30) + '...';
                                let imageURL;
                                let baseURL = typeof referenceMessage.member?.displayAvatarURL === 'function' ? referenceMessage.member.displayAvatarURL({size: 256, extension: 'png'}) : `https://cdn.discordapp.com/embed/avatars/0.png`;
                                let imageIndex = cachedImagesArr.length;
                                try{
                                    if(typeof cachedImages[baseURL] === 'string'){
                                        imageURL = cachedImages[baseURL];
                                        imageIndex = cachedImagesArr.indexOf(imageURL);
                                    } else {
                                        let imageBuffer = await getImageBase64(baseURL);
                                        imageURL = `data:${imageBuffer.contentType};base64,`+imageBuffer.buffer.toString('base64');
                                        cachedImages[baseURL] = imageURL;
                                        cachedImagesArr.push(imageURL);
                                    }
                                } catch {
                                    imageURL = baseURL;
                                    if(cachedImagesArr.indexOf(baseURL) >= 0) imageIndex = cachedImagesArr.indexOf(baseURL);
                                    else cachedImagesArr.push(baseURL);
                                }
                                repliedDiv.innerHTML = `<div class="sign">
                                </div>
                                <div class="to">
                                    <img data-index="${imageIndex}">
                                    <p class="user" style="color: ${typeof referenceMessage?.member?.roles === 'object' ? getHexColor(referenceMessage.member.roles) : '#fff'};">@${typeof referenceMessage?.member?.displayName === 'string' ? referenceMessage.member.displayName : 'Unknown username'}</p>
                                    <p class="content">${getContent(messageContent)}</p>
                                </div>`;
                            } else {
                                let imageURL;
                                let baseURL = typeof referenceMessage.member?.displayAvatarURL === 'function' ? referenceMessage.member.displayAvatarURL({size: 256, extension: 'png'}) : `https://cdn.discordapp.com/embed/avatars/0.png`
                                let imageIndex = cachedImagesArr.length;
                                try{
                                    if(typeof cachedImages[baseURL] === 'string'){
                                        imageURL = cachedImages[baseURL];
                                        imageIndex = cachedImagesArr.indexOf(imageURL);
                                    } else {
                                        let imageBuffer = await getImageBase64(baseURL);
                                        imageURL = `data:${imageBuffer.contentType};base64,`+imageBuffer.buffer.toString('base64');
                                        cachedImages[baseURL] = imageURL;
                                        cachedImagesArr.push(imageURL);
                                    }
                                } catch {
                                    imageURL = baseURL;
                                    if(cachedImagesArr.indexOf(baseURL) >= 0) imageIndex = cachedImagesArr.indexOf(baseURL);
                                    else cachedImagesArr.push(baseURL);
                                }
                                repliedDiv.innerHTML = `<div class="sign">
                                </div>
                                <div class="to">
                                    <img data-index="${imageIndex}">
                                    <p class="user" style="color: ${typeof referenceMessage?.member?.roles === 'object' ? getHexColor(referenceMessage.member.roles) : '#fff'};">@${typeof referenceMessage?.member?.displayName === 'string' ? referenceMessage.member.displayName : 'Unknown username'}</p>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="attachment-icon">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p style="color: gray;"> attachment</p>
                                </div>`;
                            }
                            div.innerHTML += repliedDiv.outerHTML;
                        }
                    }
                    const contentDiv = document.createElement('div');
                    contentDiv.classList.add(`content`);
                    const getUserContent = getContent(msg.content);
                    const getContentRoleMentions = await getMentions(getUserContent, client, interaction.guild);

                    var sendDateForm = "dd/mm/yy hour:minute";

                    const sendDate = new Date(msg.createdTimestamp);
                    sendDateForm = sendDateForm.split("dd").join(sendDate.getDate().toString().length > 1 ? sendDate.getDate().toString() : `0${sendDate.getDate().toString()}`);
                    sendDateForm = sendDateForm.split("mm").join((sendDate.getMonth() + 1).toString().length > 1 ? (sendDate.getMonth() + 1).toString() : `0${(sendDate.getMonth() + 1).toString()}`);
                    sendDateForm = sendDateForm.split("yy").join(sendDate.getFullYear());
                    sendDateForm = sendDateForm.split("hour").join(sendDate.getHours());
                    sendDateForm = sendDateForm.split("minute").join(sendDate.getMinutes().toString().length > 1 ? sendDate.getMinutes().toString() : `0${sendDate.getMinutes().toString()}`);

                    contentDiv.innerHTML = `<p class="username" style="color: ${typeof msg?.member?.roles === 'object' ? getHexColor(msg.member.roles) : '#fff'};">${typeof msg?.member?.displayName === 'string' ? msg.member.displayName : 'Unknown username'}</p>
                        <p class="send-date">${sendDateForm}</p>
                        <div class="user-content">${getContentRoleMentions}</div>`;
                    if(msg.attachments.size > 0){
                        if(msg.attachments.filter(a => !(a.contentType || '').toLowerCase().startsWith('image/')).size > 0){
                            const filesDiv = document.createElement("div");
                            filesDiv.classList.add("files");
                            filesDiv.innerHTML = ``;
                            msg.attachments.forEach(attachment => {
                                if(!(attachment.contentType || '').toLowerCase().startsWith('image/')){
                                    filesDiv.innerHTML += `<div class="file">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="file-icon">
                                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                            <polyline points="13 2 13 9 20 9"></polyline>
                                        </svg>
                                        <div class="fileinfo">
                                            <div class="filename"><a href="${attachment.url}" target="_blank">${attachment.name}</a></div>
                                            <div class="filesize">${getFileSize(attachment.size)}</div>
                                    </div>`;
                                    const key = msg.attachments.filter(a => a.url === attachment.url).firstKey();
                                    msg.attachments.delete(key);
                                }
                            });
                            contentDiv.innerHTML += filesDiv.outerHTML;
                        }
                        if(msg.attachments.filter(a => (a.contentType || '').toLowerCase().startsWith('image/')).size > 0){
                            const attachments = Array.from(msg.attachments.values()).filter(a => (a.contentType || '').toLowerCase().startsWith('image/'));
                            for(let x = 0; x < attachments.length; x++){
                                let attachment = attachments[x];
                                let imageURL;
                                let baseURL = attachment.url;
                                let imageIndex = cachedImagesArr.length;
                                try{
                                    if(typeof cachedImages[baseURL] === 'string'){
                                        imageURL = cachedImages[baseURL];
                                        imageIndex = cachedImagesArr.indexOf(imageURL);
                                    } else {
                                        let imageBuffer = await getImageBase64(baseURL);
                                        imageURL = `data:${imageBuffer.contentType};base64,`+imageBuffer.buffer.toString('base64');
                                        cachedImages[baseURL] = imageURL;
                                        cachedImagesArr.push(imageURL);
                                    }
                                } catch {
                                    imageURL = baseURL;
                                    if(cachedImagesArr.indexOf(baseURL) >= 0) imageIndex = cachedImagesArr.indexOf(baseURL);
                                    else cachedImagesArr.push(baseURL);
                                }
                                contentDiv.innerHTML += `<div class="image">
                                    <img data-index="${imageIndex}">
                                </div`;
                                const key = msg.attachments.filter(a => a.url === attachment.url).firstKey();
                                msg.attachments.delete(key);
                            }
                        }
                    }
                    if(msg.embeds.length > 0){
                        for(let x = 0; x < msg.embeds.length; x++){
                            const { data } = msg.embeds[x];
                            if((data.type || '').toLowerCase() !== 'rich') continue;
                            const embedColor = (data.color || parseInt(client.embedColor, 16));
                            const embedDiv = document.createElement(`div`);
                            embedDiv.classList.add('embed');
                            embedDiv.innerHTML = ``;
                            var embedHexColor =embedColor.toString(16);
                            while(embedHexColor.length < 6){
                                embedHexColor = '0'+embedHexColor;
                            }
                            embedDiv.innerHTML += `<div class="color" style="background-color: #${embedHexColor};"></div>`;
                            if(typeof data.title === 'string' || typeof data.description === 'string' || typeof data.author === 'object' || typeof data.fields !== 'undefined' || typeof data.image === 'object' || typeof data.thumbnail === 'object'){
                                const flexBox = document.createElement("div");
                                flexBox.classList.add('flex-box');
                                flexBox.innerHTML = ``;
                                const textContent = document.createElement('div');
                                textContent.classList.add("text-content");
                                textContent.innerHTML = ``;
                                if(typeof data.author === 'object'){
                                    const authorDiv = document.createElement("div");
                                    authorDiv.classList.add("embed-top");
                                    authorDiv.innerHTML = ``;
                                    if(typeof data.author.icon_url === 'string'){
                                        let imageURL;
                                        let baseURL = data.author.icon_url;
                                        let imageIndex = cachedImagesArr.length;
                                        try{
                                            if(typeof cachedImages[baseURL] === 'string'){
                                                imageURL = cachedImages[baseURL];
                                                imageIndex = cachedImagesArr.indexOf(imageURL);
                                            } else {
                                                let imageBuffer = await getImageBase64(baseURL);
                                                imageURL = `data:${imageBuffer.contentType};base64,`+imageBuffer.buffer.toString('base64');
                                                cachedImages[baseURL] = imageURL;
                                                cachedImagesArr.push(imageURL);
                                            }
                                        } catch {
                                            imageURL = baseURL;
                                            if(cachedImagesArr.indexOf(baseURL) >= 0) imageIndex = cachedImagesArr.indexOf(baseURL);
                                            else cachedImagesArr.push(baseURL);
                                        }
                                        authorDiv.innerHTML += `<img data-index="${imageIndex}">`;
                                        if(typeof data.author.url === 'string' && data.author.name === 'string'){
                                            authorDiv.innerHTML += `<p><a href="${data.author.url}" target="_blank">${data.author.name}</a></p>`;
                                        } else if(typeof data.author.name === 'string'){
                                            authorDiv.innerHTML += `<p>${data.author.name}</p>`;
                                        }
                                    }
                                    textContent.innerHTML += authorDiv.outerHTML;
                                }
                                if(typeof data.title === 'string'){
                                    if(typeof data.url === 'string') textContent.innerHTML += `<h3 class="title"><a href="${data.url}" target="_blank">${data.title}</a></h3>`;
                                    else textContent.innerHTML += `<h3 class="title">${data.title}</h3>`;
                                }
                                if(typeof data.description === 'string'){
                                    const getDescriptionContent = getContent(data.description);
                                    const getMentionsDescription = await getMentions(getDescriptionContent, client, interaction.guild);
                                    const getDescriptionURLS = getURLS(getMentionsDescription);
                                    textContent.innerHTML += `<p class="description">${getDescriptionURLS}</p>`;
                                }
                                if(typeof data.fields === 'object'){
                                    const fieldsDiv = document.createElement("div");
                                    fieldsDiv.classList.add("fields");
                                    fieldsDiv.innerHTML = ``;
                                    for(var z = 0; z < data.fields.length; z++){
                                        const field = data.fields[z];
                                        const fieldDiv = document.createElement("div");
                                        if(field.inline === true) fieldDiv.classList.add("field-inline");
                                        else fieldDiv.classList.add("field-no-inline");
                                        var fieldValue = getContent(field.value);
                                        fieldValue = await getMentions(fieldValue, client, interaction.guild);
                                        fieldDiv.innerHTML = `<p class="name">${field.name}</p>
                                        <p class="value">${getURLS(fieldValue)}</p>`;
                                        fieldsDiv.innerHTML += fieldDiv.outerHTML;
                                    }
                                    textContent.innerHTML += fieldsDiv.outerHTML;
                                }
                                if(typeof data.image === 'object'){
                                    const imageDiv = document.createElement("div");
                                    imageDiv.classList.add("image");
                                    let imageURL;
                                    let baseURL = data.image.url;
                                    let imageIndex = cachedImagesArr.length;
                                    try{
                                        if(typeof cachedImages[baseURL] === 'string'){
                                            imageURL = cachedImages[baseURL];
                                            imageIndex = cachedImagesArr.indexOf(imageURL);
                                        } else {
                                            let imageBuffer = await getImageBase64(baseURL);
                                            imageURL = `data:${imageBuffer.contentType};base64,`+imageBuffer.buffer.toString('base64');
                                            cachedImages[baseURL] = imageURL;
                                            cachedImagesArr.push(imageURL);
                                        }
                                    } catch {
                                        imageURL = baseURL;
                                        if(cachedImagesArr.indexOf(baseURL) >= 0) imageIndex = cachedImagesArr.indexOf(baseURL);
                                        else cachedImagesArr.push(baseURL);
                                    }
                                    imageDiv.innerHTML = `<img data-index="${imageIndex}">`;
                                    textContent.innerHTML += imageDiv.outerHTML;
                                }
                                flexBox.innerHTML += textContent.outerHTML;
                                if(typeof data.thumbnail === 'object'){
                                    const thumbnailImage = document.createElement("div");
                                    thumbnailImage.classList.add("thumbnail");
                                    let imageURL;
                                    let baseURL = data.thumbnail.url;
                                    let imageIndex = cachedImagesArr.length;
                                    try{
                                        if(typeof cachedImages[baseURL] === 'string'){
                                            imageURL = cachedImages[baseURL];
                                            imageIndex = cachedImagesArr.indexOf(imageURL);
                                        } else {
                                            let imageBuffer = await getImageBase64(baseURL);
                                            imageURL = `data:${imageBuffer.contentType};base64,`+imageBuffer.buffer.toString('base64');
                                            cachedImages[baseURL] = imageURL;
                                            cachedImagesArr.push(imageURL);
                                        }
                                    } catch {
                                        imageURL = baseURL;
                                        if(cachedImagesArr.indexOf(baseURL) >= 0) imageIndex = cachedImagesArr.indexOf(baseURL);
                                        else cachedImagesArr.push(baseURL);
                                    }
                                    thumbnailImage.innerHTML = `<img data-index="${imageIndex}">`;
                                    flexBox.innerHTML += thumbnailImage.outerHTML;
                                }
                                embedDiv.innerHTML += flexBox.outerHTML;
                            }
                            if(typeof data.footer === 'object' || typeof data.timestamp === 'string'){
                                const bottomDiv = document.createElement("div");
                                bottomDiv.classList.add("bottom");
                                bottomDiv.innerHTML = ``;
                                if(typeof data.footer === 'object'){
                                    const footerDiv = document.createElement("div");
                                    footerDiv.classList.add("footer");
                                    footerDiv.innerHTML = ``;
                                    if(typeof data.footer.icon_url === 'string'){
                                        let imageURL;
                                        let baseURL = data.footer.icon_url;
                                        let imageIndex = cachedImagesArr.length;
                                        try{
                                            if(typeof cachedImages[baseURL] === 'string'){
                                                imageURL = cachedImages[baseURL];
                                                imageIndex = cachedImagesArr.indexOf(imageURL);
                                            } else {
                                                let imageBuffer = await getImageBase64(baseURL);
                                                imageURL = `data:${imageBuffer.contentType};base64,`+imageBuffer.buffer.toString('base64');
                                                cachedImages[baseURL] = imageURL;
                                                cachedImagesArr.push(imageURL);
                                            }
                                        } catch {
                                            imageURL = baseURL;
                                            if(cachedImagesArr.indexOf(baseURL) >= 0) imageIndex = cachedImagesArr.indexOf(baseURL);
                                            else cachedImagesArr.push(baseURL);
                                        }
                                        footerDiv.innerHTML += `<img data-index="${imageIndex}">`;
                                    }
                                    if(typeof data.footer.text === 'string'){
                                        footerDiv.innerHTML += `<p>${data.footer.text}</p>`;
                                    }
                                    bottomDiv.innerHTML += footerDiv.outerHTML;
                                }
                                if(typeof data.footer === 'object' && typeof data.timestamp === 'string') bottomDiv.innerHTML += `<p class="dot">•</p>`;
                                if(typeof data.timestamp === 'string'){
                                    const timestampDate = new Date(data.timestamp);
                                    var timestampDateString = "dd/mm/yy";
                                    timestampDateString = timestampDateString.split("dd").join(timestampDate.getDate().toString().length > 1 ? timestampDate.getDate().toString() : `0${timestampDate.getDate().toString()}`);
                                    timestampDateString = timestampDateString.split("mm").join((timestampDate.getMonth() + 1).toString().length > 1 ? (timestampDate.getMonth() + 1).toString() : `0${(timestampDate.getMonth() + 1).toString()}`);
                                    timestampDateString = timestampDateString.split("yy").join(timestampDate.getFullYear());
                                    bottomDiv.innerHTML += `<p class="timestamp">${timestampDateString}</p>`;
                                }
                                embedDiv.innerHTML += bottomDiv.outerHTML;
                            }
                            contentDiv.innerHTML += embedDiv.outerHTML;
                        }
                    }
                    let imageURL;
                    let baseURL = typeof msg.member?.displayAvatarURL === 'function' ? msg.member.displayAvatarURL({size: 256, extension: 'png'}) : `https://cdn.discordapp.com/embed/avatars/0.png`;
                    let imageIndex = cachedImagesArr.length;
                    try{
                        if(typeof cachedImages[baseURL] === 'string'){
                            imageURL = cachedImages[baseURL];
                            imageIndex = cachedImagesArr.indexOf(imageURL);
                        } else {
                            let imageBuffer = await getImageBase64(baseURL);
                            imageURL = `data:${imageBuffer.contentType};base64,`+imageBuffer.buffer.toString('base64');
                            cachedImages[baseURL] = imageURL;
                            cachedImagesArr.push(imageURL);
                        }
                    } catch {
                        imageURL = baseURL;
                        if(cachedImagesArr.indexOf(baseURL) >= 0) imageIndex = cachedImagesArr.indexOf(baseURL);
                        else cachedImagesArr.push(baseURL);
                    }
                    div.innerHTML += `<div class='user-top'>
                    <img data-index='${imageIndex}'>
                    ${contentDiv.outerHTML}
                    </div>`;
                    parentDiv.appendChild(div);
                }


                file = file.split('{MESSAGES}').join(parentDiv.outerHTML);
                file = file.split('{IMAGEINFO}').join('let cachedImages = ['+cachedImagesArr.map(i => "\""+i+"\"").join(',')+'];');
                client.clientParser.event.emit('ticketClose', interaction.channel, Buffer.from(file), {...ticketInfo, opener: ticketFrom.firstKey()});

                saveTemporary(`transcript-${interaction.channel.id}.html`, file);

                interaction.channel.delete().then(async ch => {
                    var totalTicketAmount = client.deepCopy((client.globals.get(`ticket_count`) || {}));
                    var ticketAmount = totalTicketAmount[interaction.guild.id] || {closed: 0, open: 0};
                    ++ticketAmount.closed;
                    --ticketAmount.open;
                    if(ticketAmount.open < 0) ticketAmount.open = 0;
                    totalTicketAmount[interaction.guild.id] = ticketAmount;
                    try{
                        await client.dbHandler.setValue(`globals`, totalTicketAmount, {'globalsKey': 'ticket_count'});
                    } catch {}

                    const closeEmbed = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setTitle(handleMessages(client, interaction.member.user, user, ch, messages.tickets['close-ticket']['success-message'].title))
                    .setDescription(handleMessages(client, interaction.member.user, user, ch, messages.tickets['close-ticket']['success-message'].message, [{REASON: reason.split("`").join("")}]).split('[OPENED DATE]').join(new Date(ch.createdTimestamp).toString()).split('[CLOSED DATE]').join(new Date().toString()))
                    .setTimestamp(new Date().getTime());
                    new Promise(resolve => {
                        if(client.ticketLogs[interaction.guild.id] instanceof TextChannel){
                            client.ticketLogs[interaction.guild.id].send({embeds: [closeEmbed], files: [new AttachmentBuilder(path.join(__dirname, `../../files/temporary/transcript-${ch.id}.html`))]}).then(() => {
                                resolve();
                            }).catch(err => {
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    }).then(async () => {
                        await wait(400);
                        new Promise(resolve => {
                            if(!(user instanceof User)) return resolve();
                            if(typeof user.send === 'function' && client.config.tickets.dm[interaction.guild.id] === true){
                                user.send({embeds: [closeEmbed], files: [new AttachmentBuilder(path.join(__dirname, `../../files/temporary/transcript-${ch.id}.html`))]}).then(() => {
                                    resolve();
                                }).catch(err => {
                                    resolve();
                                });
                            } else {
                                resolve();
                            }
                        }).then(async () => {
                            try{
                                await unlink(path.join(__dirname, `../../files/temporary/transcript-${ch.id}.html`));
                            } catch (err){}
                        });
                    });
                }).catch(console.log);
            });
        }).catch(err => {
            if(isInteraction) interaction.editReply({embeds: [failedClosing], ephemeral: true}).catch(err => {});
            else interaction.channel.send({embeds: [failedClosing], ephemeral: true}).catch(err => {});
        });
    }
}
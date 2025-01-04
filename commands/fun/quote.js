const canvas = require('@napi-rs/canvas');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios').default;
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait, validateEmote } = require('../../functions.js');
const GraphimeSplitter = require('grapheme-splitter');

module.exports = {
    data: {
        name: 'quote',
        description: 'Quote a message of someone',
        options: [{type: 3, name: 'message-id', description: 'The id of the message you\'d like to quote', required: true}, {type: 7, name: 'channel', description: 'The channel the message was sent in', required: false, channel_types: [0]}],
        category: 'Fun',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const invalidMessageId = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.quote['invalid-message-id'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.quote['invalid-message-id'].message))
        .setTimestamp();

        const messageId = args[1];
        if(!/^[0-9]{16,26}$/.test(messageId)) return sendMessage({embeds: [invalidMessageId]}).catch(err => {});

        const channel = interaction === false ? (message.mentions.channels.size > 0 ? message.mentions.channels.first() : message.channel) : (message.options.getChannel('channel') ?? message.channel);

        const messageNotExists = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, channel, messages.fun.quote['message-not-exists'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, channel, messages.fun.quote['message-not-exists'].message))
        .setTimestamp();

        let msg = channel.messages.cache.get(messageId);
        if(!msg){
            try{
                msg = await channel.messages.fetch(messageId);
            } catch {
                return sendMessage({embeds: [messageNotExists]}).catch(err => {});
            }
        }

        const noContent = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, channel, messages.fun.quote['no-content'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, channel, messages.fun.quote['no-content'].message))
        .setTimestamp();

        if(msg.content.length === 0) return sendMessage({embeds: [noContent]}).catch(err => {});

        const loading = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, channel, messages.fun.quote['loading'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, channel, messages.fun.quote['loading'].message))
        .setTimestamp();

        let _msg = null;
        try{
            _msg = await sendMessage({embeds: [loading]});
        } catch {}

        const quoteCanvas = canvas.createCanvas(700, 300);
        const ctx = quoteCanvas.getContext('2d');

        ctx.fillStyle = "#1E1E1E";
        ctx.fillRect(0, 0, quoteCanvas.width, quoteCanvas.height);

        const unknownError = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, channel, messages.fun.quote['unknown-error'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, channel, messages.fun.quote['unknown-error'].message))
        .setTimestamp();

        let imgData;

        try{
            imgData = await axios.get(msg.member.displayAvatarURL({extension: 'png', size: 512}), {responseType: 'arraybuffer'});
        } catch {
            return sendMessage({embeds: [unknownError]}).catch(err => {});
        }

        let img = new canvas.Image();
        img.src = Buffer.from(imgData.data);
        img.height = quoteCanvas.height;
        img.width = img.height;
        
        const imageAnalyze = canvas.createCanvas(img.width, img.height);
        const imageCtx = imageAnalyze.getContext('2d');
        imageCtx.drawImage(img, 0, 0, img.width, img.height);
        let imgInfo = imageCtx.getImageData(0, 0, img.width, img.height).data;

        let i = 0;
        for(let y = 0; y < 300; y++){
            for(let x = 0; x < 300; x++){
                ctx.fillStyle = "rgba("+imgInfo[i]+", "+imgInfo[i+1]+", "+imgInfo[i+2]+", "+Math.round(Math.round(imgInfo[i+3]*(1-x/300))/255*100)/100+")";
                ctx.fillRect(x, y, 1, 1);
                i += 4;
                ctx.fill()
            }
        }

        let fontSize = 50;
        ctx.font = fontSize+"px Default Font";
        let msW = ctx.measureText(msg.member.displayName);
        while(msW.width > 360 && fontSize > 20){
            fontSize -= 10;
            ctx.font = fontSize+"px Default Font";
            msW = ctx.measureText(msg.member.displayName);
        }

        ctx.fillStyle = "#ffffff";
        if(msW.width > 360){
            ctx.fillText(msg.member.displayName, 320, 80);
        } else {
            ctx.fillText(msg.member.displayName, 500 - msW.width / 2, 80);
        }

        ctx.font = "20px Default Font";
        let msgContent = msg.content.split("\n").join(" ");
        
        msgContent = `"${msgContent}"`;
        msgContent = msgContent.split(" ");
        let tLines = [];
        for(let i = 0; i < msgContent.length; i++){
            let newLine = (tLines.length > 0 ? tLines[tLines.length - 1] + " " : "") + msgContent[i];
            let measureLine = ctx.measureText(newLine);
            if(measureLine.width < 320){
                if(tLines.length > 0) tLines[tLines.length - 1] = newLine;
                else tLines.push(newLine);
            } else {
                tLines.push(msgContent[i]);
            }
        }

        if(tLines.length > 7){
            tLines = tLines.slice(0, 7);
            tLines[6] += "...";
        }
        let amountLines = tLines.length;

        const splitter = new GraphimeSplitter();

        for(let i = 0; i < tLines.length; i++){
            let lineWidth = splitter.splitGraphemes(tLines[i]).map(l => {
                if(validateEmote(l)){
                    ctx.font = "20px Emojis";
                    return ctx.measureText(l).width;
                } else {
                    ctx.font = "20px Default Font";
                    return ctx.measureText(l).width;
                }
            }).reduce((n, c) => {
                n += c;
                return n;
            }, 0);
            let _l = splitter.splitGraphemes(tLines[i]);
            let start = 500 - lineWidth / 2;
            for(let z = 0; z < _l.length; z++){
                if(validateEmote(_l[z])){
                    ctx.font = "20px Emojis";
                } else {
                    ctx.font = "20px Default Font";
                }
                let charWidth = ctx.measureText(_l[z]);
                ctx.fillText(_l[z], start, 200 - (amountLines - 1) * 10 + 20*i);
                start += charWidth.width;
            }
        }

        let buffer = quoteCanvas.toBuffer('image/png');
        
        let file = new AttachmentBuilder().setFile(buffer).setName('quote.png');

        if(_msg !== null){
            _msg.edit({embeds: [], files: [file]}).catch(err => {});
        } else {
            sendMessage({files: [file]}).catch(err => {});
        }
    }
}
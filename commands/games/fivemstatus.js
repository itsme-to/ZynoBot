const { EmbedBuilder } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");
const { applyText, saveTemporary, usernameCreator } = require("../../functions.js");
const fs = require("fs");
const path = require("path");
const Canvas = require("@napi-rs/canvas");
const axios = require("axios").default;

module.exports = {
    data: {
        name: 'fivemstatus',
        description: 'Get the status of the FiveM server',
        options: [],
        category: 'Games',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const disabledEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.fivem.disabled.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.games.fivem.disabled.message))
        .setTimestamp();

        if(typeof client.config.fivem[message.guild.id].server !== 'string') return sendMessage({embeds: [disabledEmbed]}).catch(err => {});
        var port = 30120;
        var serverIp = client.config.fivem[message.guild.id].server;
        if(serverIp.indexOf(":") >= 0){
            port = parseInt(serverIp.split(":")[1]);
            if(!port){
                port = 30120;
                serverIp = client.config.fivem[message.guild.id].server;
            } else {
                serverIp = serverIp.split(":")[0];
            }
        }

        const offline = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.fivem.offline.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.games.fivem.offline.message))
        .setTimestamp();

        Promise.all([
            axios.get('http://'+serverIp+':'+port+'/info.json', {timeout: 3000, responseType: 'json'}),
            axios.get('http://'+serverIp+':'+port+'/players.json', {timeout: 3000, responseType: 'json'})
        ]).then(async res => {
            const canvas = Canvas.createCanvas(640, 128);
            const ctx = canvas.getContext(`2d`);
            const user = message.member.user;
            ctx.fillStyle = client.embedColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (fs.existsSync(path.join(__dirname, `../../`, client.config.fivem[message.guild.id]['background-image']))) {
                const backgroundImage = new Canvas.Image();
                var backgroundImageBuffer = fs.readFileSync(path.join(__dirname, `../../`, client.config.fivem[message.guild.id]['background-image']));
                backgroundImage.src = Buffer.from(backgroundImageBuffer);
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = "#2e2e2e";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            var serverName = typeof res[0].data?.vars?.gamename === 'string' ? res[0].data.vars.gamename : 'FiveM server';

            ctx.fillStyle = "#ffff00";
            ctx.font = applyText(canvas, serverName, 50, `Default Font`, 0, 165);
            ctx.fillText(serverName, 150, 60);

            var players = Array.from(res[1].data);
            var maxPlayers = typeof res[0].data?.vars?.sv_maxClients !== 'undefined' ? (parseInt(res[0].data.vars.sv_maxClients) || 64) : 64;

            ctx.fillStyle = "#fff";
            ctx.font = applyText(canvas, players.length + "/" + maxPlayers + " players", 20, `Default Font`, 415);
            ctx.fillText(players.length + "/" + maxPlayers + " players", 150, 100);

            ctx.fillStyle = "#78b159";
            ctx.font = applyText(canvas, "Online", 20, `Default Font`, 415);
            ctx.fillText("Online", 415, 100);

            ctx.fillStyle = "#fff";

            var imageName = `fivem-status-${usernameCreator(user)}.png`;
            const imageBuffer = canvas.toBuffer('image/png');

            saveTemporary(imageName, imageBuffer);

            const fivemstatus = new EmbedBuilder()
            .setColor(client.embedColor)
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.fivem.status.title))
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setImage(`attachment://${imageName}`)
            .setTimestamp();

            try {
                await sendMessage({ embeds: [fivemstatus], files: [path.join(__dirname, `../../files/temporary/${imageName}`)] });
            } catch {}

            fs.unlinkSync(path.join(__dirname, `../../files/temporary/${imageName}`));
        }).catch(err => {
            console.log(err);
            sendMessage({embeds: [offline]}).catch(err => {});
        });
    }
}
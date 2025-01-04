const { EmbedBuilder } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");
const { applyText, saveTemporary, usernameCreator } = require("../../functions.js");
const axios = require('axios').default;
const fs = require("fs");
const path = require("path");
const Canvas = require("@napi-rs/canvas");

module.exports = {
    data: {
        name: 'mcstatus',
        description: 'Get the status of the Minecraft server',
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.disabled.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.disabled.message))
        .setTimestamp();

        if(typeof client.config.minecraft[message.guild.id].server !== 'string') return sendMessage({embeds: [disabledEmbed]}).catch(err => {});

        const loadingEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.loading.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.loading.message))
        .setTimestamp();

        let msg = null;
        try{
            msg = await sendMessage({embeds: [loadingEmbed]});
        } catch {}
            
        const offline = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.offline.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.offline.message))
        .setTimestamp();

        var port = 25565;
        var serverIp = client.config.minecraft[message.guild.id].server;
        if(serverIp.indexOf(":") >= 0){
            port = parseInt(serverIp.split(":")[1]);
            if(!port){
                port = 25565;
                serverIp = client.config.minecraft[message.guild.id].server;
            } else {
                serverIp = serverIp.split(":")[0];
            }
        }
        new Promise((resolve, reject) => {
            if(client.config.minecraft[message.guild.id].type === "java"){
                axios.get(`https://api.mcstatus.io/v2/status/java/${serverIp}:${port}`, {responseType: 'json', timeout: 3e3}).then(res => resolve(res.data)).catch(reject);
            } else if(client.config.minecraft[message.guild.id].type === "bedrock"){
                axios.get(`https://api.mcstatus.io/v2/status/bedrock/${serverIp}:${port}`, {responseType: 'json', timeout: 3e3}).then(res => resolve(res.data)).catch(reject);
            } else {
                reject();
            }
        }).then(async (result) => {
            if(result.online === false){
                if(msg !== null) msg.edit(client.handleContent(message, {embeds: [offline]})).catch(err => {});
                else sendMessage({embeds: [offline]}).catch(err => {});
            }
            const canvas = Canvas.createCanvas(640, 128);
            const ctx = canvas.getContext(`2d`);
            const user = message.member.user;
            ctx.fillStyle = client.embedColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (fs.existsSync(path.join(__dirname, `../../`, client.config.minecraft[message.guild.id]['background-image']))) {
                const backgroundImage = new Canvas.Image();
                var backgroundImageBuffer = fs.readFileSync(path.join(__dirname, `../../`, client.config.minecraft[message.guild.id]['background-image']));
                backgroundImage.src = Buffer.from(backgroundImageBuffer);
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = "#2e2e2e";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.fillStyle = "#ffff00";
            ctx.font = applyText(canvas, result.motd.clean, 60, `Default Font`, 165);
            ctx.fillText(result.motd.clean, 150, 60);

            ctx.fillStyle = "#fff";
            ctx.font = applyText(canvas, result.players.online + "/" + result.players.max + " players", 20, `Default Font`, 430);
            ctx.fillText(result.players.online + "/" + result.players.max + " players", 150, 100);

            ctx.font = applyText(canvas, result.version.name_clean, 20, `Default Font`, 430);
            ctx.fillText(result.version.name_clean, 415, 100);

            var imageName = `mc-status-${usernameCreator(user)}.png`;
            const imageBuffer = canvas.toBuffer('image/png');

            saveTemporary(imageName, imageBuffer);

            const mcstatus = new EmbedBuilder()
            .setColor(client.embedColor)
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.games.minecraft.status.title))
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true }) })
            .setImage(`attachment://${imageName}`)
            .setTimestamp();

            try {
                if(msg !== null) await msg.edit(client.handleContent(message, { embeds: [mcstatus], files: [path.join(__dirname, `../../files/temporary/${imageName}`)] }));
                else await sendMessage({ embeds: [mcstatus], files: [path.join(__dirname, `../../files/temporary/${imageName}`)] });
            } catch {}

            fs.unlinkSync(path.join(__dirname, `../../files/temporary/${imageName}`));
        }).catch(err => {

            if(msg !== null) msg.edit(client.handleContent(message, {embeds: [offline]})).catch(err => {});
            else sendMessage({embeds: [offline]}).catch(err => {});

        });
    }
}
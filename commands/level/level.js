const { EmbedBuilder, PresenceUpdateStatus, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios").default;
const Canvas = require("@napi-rs/canvas");
const { getXPForLevel, applyText, wait } = require("../../functions.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'level',
        description: 'See your or someone else his/her level',
        category: 'Level',
        options: [{type: 6, name: 'user', description: 'The user where you want to see their level from', required: false}],
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);
        const canvasType = client.config.level['canvas-type'][message.guild.id];

        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
        
        function rgbToHex(rgb){
            let hex = "#";
            for(const c in rgb){
                let color = rgb[c].toString(16);
                hex += color.length === 1 ? "0"+color : color;
            }
            return hex;
        }

        var user;
        if(interaction === true){
            user = message.options.getUser(`user`);
            if(!user) user = message.member;
            else {
                user = await client.cache.getMember(user.id, message.guild);
            }
        } else {
            if(message.mentions.members.first()){
                user = message.mentions.members.first();
            } else {
                user = message.member;
            }
        }

        const loadingEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.level["user-level-loading"].title))
        .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.level["user-level-loading"].message))
        .setTimestamp();

        var msg = replyMessage = null;
        try{
            msg = await sendMessage({embeds: [loadingEmbed]});
            replyMessage = client.replyMessage(message, false, msg);
        } catch {}
        await wait(400);

        var xp = client.deepCopy(client.xp.get(user.id) || [{messages: 0, level: 0, xp: 0, guild: message.guild.id}]).filter(e => e.guild === message.guild.id)[0] || {messages: 0, level: 0, xp: 0, guild: message.guild.id};
        if(typeof xp.xp !== 'number'){
            xp.xp = getXPForLevel(xp.level, message.guild.id);
            try{
                await client.dbHandler.xpHandler(xp, {memberId: user.id, guildId: message.guild.id});
            } catch {}
        }

        const canvas = Canvas.createCanvas(800, 300);
        const ctx = canvas.getContext(`2d`);
        
        if(canvasType === "CLASSIC"){
            if(fs.existsSync(path.join(__dirname, `../../`, client.config.level['background-canvas']))){
                const backgroundImage = new Canvas.Image();
                var backgroundImageBuffer = fs.readFileSync(path.join(__dirname, `../../`, client.config.level['background-canvas']));
                backgroundImage.src = Buffer.from(backgroundImageBuffer);
                ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            } else {
                ctx.fillStyle = "#2e2e2e";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.strokeStyle = client.embedColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        } else if(canvasType === "MODERN"){
            let lightedEmbedColor = hexToRgb(client.embedColor);
            if(!lightedEmbedColor){
                lightedEmbedColor = client.embedColor;
            } else {
                for(const c in lightedEmbedColor){
                    lightedEmbedColor[c] = lightedEmbedColor[c] + 40 > 255 ? 255 : lightedEmbedColor[c] + 40;
                }
                lightedEmbedColor = rgbToHex(lightedEmbedColor);
            }
            
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, client.embedColor);
            gradient.addColorStop(0.5, lightedEmbedColor);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
            
            ctx.beginPath();
            ctx.roundRect(20, 20, canvas.width - 40, canvas.height - 40, 30);
            ctx.fill();
            ctx.closePath();
        } else {

            const invalidCanvasType = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.level["invalid-canvas-type"].title))
            .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.level["invalid-canvas-type"].message))
            .setTimestamp();

            try{
                if(msg === null) await sendMessage({embeds: [invalidCanvasType]});
                else await replyMessage({embeds: [invalidCanvasType]});
            } catch (err){
                if(client.debugger){
                    console.log(`[SYSTEM]`, err);
                }
            }
            return;
        }

        try{
            var userProfileBuffer = await axios.get(user.displayAvatarURL({dynamic: true}), {responseType: 'arraybuffer'});
            var userProfile = new Canvas.Image();
            userProfile.src = Buffer.from(userProfileBuffer.data);
            if(canvasType === "CLASSIC"){
                ctx.save();
                ctx.beginPath();
                ctx.arc(120, 150, 100, 0, Math.PI * 2, true);
                ctx.clip();
                ctx.closePath();
                ctx.drawImage(userProfile, 20, 50, 200, 200);
                ctx.restore();
            } else if(canvasType === "MODERN") {
                ctx.save();
                ctx.beginPath();
                ctx.arc(140, 150, 90, 0, Math.PI * 2, true);
                ctx.clip();
                ctx.closePath();
                ctx.drawImage(userProfile, 50, 60, 180, 180);
                ctx.restore();

                ctx.save();
                ctx.beginPath();
                ctx.arc(197.5, 222.5, 12.5, 0, Math.PI * 2, true);
                ctx.clip();
                ctx.closePath();
                switch(user.presence?.status){
                    case PresenceUpdateStatus.DoNotDisturb:
                        ctx.fillStyle = "#E12D2D";
                        break;
                    case PresenceUpdateStatus.Idle:
                        ctx.fillStyle = "#F1E041";
                        break;
                    case PresenceUpdateStatus.Online:
                        ctx.fillStyle = "#2DE133";
                        break;
                    default:
                        ctx.fillStyle = "#A6AEA6";
                        break;
                }
                ctx.fillRect(185, 210, 25, 25);
                ctx.restore();
            }
        } catch {}
        
        var nextLevelXP = getXPForLevel(xp.level + 1, message.guild.id);
        var currentLevelXP = getXPForLevel(xp.level, message.guild.id);
        var currentXP = xp.xp;
        
        var progressWidth;
        
        ctx.fillStyle = "#fff";
        if(canvasType === "CLASSIC"){
            ctx.font = applyText(canvas, user.displayName, 50, `Default Font`, 350);
            ctx.fillText(user.displayName, 350, 100);
        
            ctx.font = "30px Default Font";
            ctx.fillText(`Level ${xp.level}`, 352.5, 180);

            progressWidth = Math.round((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP) * 400) + 350;
            progressWidth = progressWidth >= 352 ? progressWidth : 352;
            progressWidth = progressWidth > 752 ? 752 : progressWidth;

            ctx.strokeStyle = "#fff";
        
            ctx.save();
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(357, 200);
            ctx.lineTo(747, 200);
            ctx.quadraticCurveTo(752, 200, 752, 205);
            ctx.lineTo(752, 225);
            ctx.quadraticCurveTo(752, 230, 747, 230);
            ctx.lineTo(357, 230);
            ctx.quadraticCurveTo(352, 230, 352, 225);
            ctx.lineTo(352, 205);
            ctx.quadraticCurveTo(352, 200, 357, 200);
            ctx.stroke();
            ctx.closePath();

            ctx.restore();
            
            ctx.lineWidth = 28;
            ctx.beginPath();
            ctx.moveTo(352, 215);
            ctx.lineTo(progressWidth, 215);
            ctx.stroke();
            ctx.closePath();
        } else if(canvasType === "MODERN"){
            let fontSize = 30;
            ctx.font = fontSize+"px Default Font";
        
            let measure = ctx.measureText(user.displayName);
            while(measure.width > 150 && fontSize > 10){
                fontSize -= 5;
                ctx.font = fontSize+"px Default Font";
                measure = ctx.measureText(user.displayName);
            }
            
            ctx.font = fontSize+"px Default Font";

            ctx.fillText(user.displayName, 270, 120);
        
            let measureLevel = ctx.measureText("Level");
            ctx.fillText(`Level`, 440, 120);

            let measureLevelText = ctx.measureText(xp.level.toString());
            ctx.font = "bold 38px Default Font";
            ctx.fillText(xp.level.toString(), 440 + measureLevel.width + 10, 120);
            
            ctx.font = "23px Default Font";
            let measurePosition = ctx.measureText("Rank");
            ctx.fillText(`Rank`, 440 + measureLevel.width + measureLevelText.width + 40, 120);

            let users = client.xp.toReadableArray().filter(x => x.value.filter(_x => _x.guild === message.guild.id).length > 0).map(x => {
                return {
                    key: x.key,
                    value: x.value.filter(f => f.guild === message.guild.id)[0]
                };
            }).sort((a, b) => {
                if(typeof b.value.xp !== 'number'){
                    b.value.xp = getXPForLevel(b.value.level, message.guild.id);
                }
                if(typeof a.value.xp !== 'number'){
                    a.value.xp = getXPForLevel(a.value.level, message.guild.id);
                }
                return b.value.xp - a.value.xp;
            });

            let findMember = users.filter(x => x.key === user.id)[0];
            let rank = users.length + 1;
            if(findMember){
                rank = users.indexOf(findMember) + 1;
            }
            
            ctx.font = "bold 38px Default Font";
            ctx.fillText(`#${rank}`, 440 + measureLevel.width + measureLevelText.width + 40 + measurePosition.width + 10, 120);
            let measurePositionText = ctx.measureText(`#${rank}`);

            let xEndPosition = 440 + measureLevel.width + measureLevelText.width + 40 + measurePosition.width + measurePositionText.width + 5;

            let diffPerc = (currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP);
            progressWidth = Math.round(diffPerc * xEndPosition) + 273;
            progressWidth = progressWidth >= 283 ? progressWidth : 273;
            progressWidth = progressWidth > xEndPosition + 6 ? xEndPosition + 6 : progressWidth;

            ctx.strokeStyle = "#919291";

            ctx.save();
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(280, 150);
            ctx.lineTo(xEndPosition - 10, 150);
            ctx.quadraticCurveTo(xEndPosition, 150, xEndPosition, 160);
            ctx.lineTo(xEndPosition, 190);
            ctx.quadraticCurveTo(xEndPosition, 200, xEndPosition - 10, 200);
            ctx.lineTo(280, 200);
            ctx.quadraticCurveTo(270, 200, 270, 190);
            ctx.lineTo(270, 160);
            ctx.quadraticCurveTo(270, 150, 281, 150);
            ctx.stroke();
            ctx.closePath();

            ctx.restore();
            
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(268.5, 148.5, progressWidth - 273, 53, 10);
            ctx.fill();
            ctx.closePath();
        }

        
        let nextLevelXPText = nextLevelXP.toString();
        let currentLevelXPText = currentXP.toString();
        if(nextLevelXP > 1e6){
        	nextLevelXPText = (Math.ceil(nextLevelXP / 1e5) / 10).toString() + "M";
        } else if(nextLevelXP > 1e3){
        	nextLevelXPText = (Math.ceil(nextLevelXP / 1e2) / 10).toString() + "K";
        }
        
        if(currentXP > 1e6){
        	currentLevelXPText = (Math.ceil(currentXP / 1e5) / 10).toString() + "M";
        } else if(currentXP > 1e3){
        	currentLevelXPText = (Math.ceil(currentXP / 1e2) / 10).toString() + "K";
        }

        if(canvasType === "CLASSIC"){
            ctx.font = "15px Default Font";
            ctx.fillText(`(${currentLevelXPText}/${nextLevelXPText} XP)`, 352, 250);
        } else if(canvasType === "MODERN"){
            ctx.font = "18px Default Font";
            ctx.fillText(`XP: ${currentLevelXPText} / ${nextLevelXPText}`, 270, 245);
        }

        const imageBuffer = canvas.toBuffer('image/png');

        const attachment = new AttachmentBuilder().setFile(imageBuffer).setName('level-image.png');

        const levelEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.level["user-level"].title))
        .setImage(`attachment://level-image.png`)
        .setTimestamp();

        if(typeof messages.level["user-level"].message === 'string'){
            levelEmbed.setDescription(handleMessage(client, message.member.user, user, message.channel, messages.level["user-level"].message));
        }

        try{
            if(msg === null) await sendMessage({embeds: [levelEmbed], files: [attachment]});
            else await replyMessage({embeds: [levelEmbed], files: [attachment]});
        } catch(err){
            console.log(err);
        }
    }
}
const fs = require("fs");
const path = require("path");
const { EmbedBuilder, ChannelType } = require("discord.js");
const Canvas = require("@napi-rs/canvas");
const axios = require("axios").default;
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");
const { wait, saveTemporary } = require("../../functions");

module.exports = {
    data: {
        name: 'serverinfo',
        description: 'Get information about the Discord server',
        options: [],
        category: 'General',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const loadingEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.serverinfo["serverinfo-loading"].title, [{GUILD_NAME: message.guild.name}]))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.serverinfo["serverinfo-loading"].message, [{GUILD_NAME: message.guild.name}]))
        .setTimestamp();

        var msg = replyMessage = null;
        try{
            msg = await sendMessage({embeds: [loadingEmbed]});
            replyMessage = client.replyMessage(message, false, msg);
        } catch {}

        await wait(400);

        var membersCount = client.deepCopy((client.globals.get(`membersCount`) ?? {}));
        if(!membersCount[message.guild.id]){
            membersCount[message.guild.id] = [];
            var week = 1000 * 60 * 60 * 24 * 7;
            while(membersCount[message.guild.id].length < 5){
                var currentDate = new Date().getTime();
                var membersCountObj = {
                    count: message.guild.memberCount,
                    timestamp: currentDate - (week * membersCount[message.guild.id].length)
                };
                membersCount[message.guild.id].push(membersCountObj);
            }
            membersCount[message.guild.id].reverse();
            try{
                await client.dbHandler.setValue(`globals`, membersCount, {'globalsKey': `membersCount`});
            } catch {}
        }
        var membersCountArray = membersCount[message.guild.id].map(m => m.count);
        var highest = Math.max(...membersCountArray);
        var lowest = Math.min(...membersCountArray);

        var ySpace = 200/(highest-lowest === 0 ? highest : highest-lowest);

        const canvas = Canvas.createCanvas(800, 400);
        const ctx = canvas.getContext(`2d`);

        ctx.fillStyle = "#2e2e2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = client.config['embed-color'];
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        var serverImage = message.guild.iconURL({dynamic: false, size: 256}) || client.user.displayAvatarURL({dynamic: false, size: 256});

        try{
            var logoImageData = await axios.get(serverImage, {responseType: 'arraybuffer'});
            const logo = new Canvas.Image();
            if(typeof logoImageData.data !== 'undefined'){
                logo.src = Buffer.from(logoImageData.data);
                ctx.save();
                ctx.beginPath();
                ctx.arc(50, 50, 40, 0, Math.PI * 2, true);
                ctx.clip();
                ctx.closePath();
                ctx.drawImage(logo, 10, 10, 80, 80);
                ctx.restore();
            }
        } catch {}

        var textSpace = 13+(1/8);
        var txt = handleMessage(client, message.member.user, undefined, message.channel, messages.general.serverinfo.memberOverview.title);
        ctx.fillStyle = client.embedColor;
        ctx.font = "40px Default Font";
        ctx.fillText(txt, txt.length*textSpace, 65);

        ctx.strokeStyle = client.embedColor;
        
        var space = Math.round(canvas.width / 5);
        
        ctx.lineWidth = 4;

        for(var i = 0; i < membersCount[message.guild.id].length; i++){
            var x = space / 2;
            x += space * i;
            var membersCountInfo = membersCount[message.guild.id][i];

            var yCordinate = 320 - ((membersCountInfo.count * ySpace) - (ySpace * lowest));

            ctx.beginPath();
            ctx.arc(x, yCordinate, 10, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.closePath();

            if(i !== (membersCount[message.guild.id].length - 1)){
                var nextMembers = membersCount[message.guild.id][i + 1];
                ctx.moveTo(x, yCordinate);
                var yCordinateNext = 320 - ((nextMembers.count * ySpace) - (ySpace * lowest));
                x = space / 2 + space * (i + 1);
                ctx.lineTo(x, yCordinateNext);
                ctx.stroke();
            }
        }

        ctx.fillStyle = "#fff";
        ctx.font = "15px Default Font";

        textSpace = 4+(1/6);

        for(var i = 0; i < membersCount[message.guild.id].length; i++){
            var membersCountInfo = membersCount[message.guild.id][i];
            var x = space / 2;
            x += space * i;
            var yCordinate = 320 - ((membersCountInfo.count * ySpace) - (ySpace * lowest));

            var amountText = handleMessage(client, message.member.user, undefined, message.channel, messages.general.serverinfo.memberOverview.memberText, [{MEMBERS: membersCountInfo.count}]);
            var dateText = messages.general.serverinfo.dateformat;

            const dateMembers = new Date(membersCountInfo.timestamp);
            dateText = dateText.split("dd").join(dateMembers.getDate().toString().length > 1 ? dateMembers.getDate().toString() : `0${dateMembers.getDate().toString()}`);
            dateText = dateText.split("mm").join((dateMembers.getMonth() + 1).toString().length > 1 ? (dateMembers.getMonth() + 1).toString() : `0${(dateMembers.getMonth() + 1).toString()}`);
            dateText = dateText.split("yy").join(dateMembers.getFullYear());

            ctx.fillText(amountText, (x - amountText.length*textSpace), yCordinate + 40);
            ctx.fillText(dateText, (x - dateText.length*textSpace), yCordinate + 60);
        }

        const toBuffer = canvas.toBuffer('image/png');

        saveTemporary(`memberCount-${message.guild.id}.png`, toBuffer);

        var serverCreated = `${messages.general.serverinfo.dateformat} hour:minute`;
        const serverCreatedDate = new Date(message.guild.createdTimestamp);
        serverCreated = serverCreated.split("dd").join(serverCreatedDate.getDate().toString().length > 1 ? serverCreatedDate.getDate().toString() : `0${serverCreatedDate.getDate().toString()}`);
        serverCreated = serverCreated.split("mm").join((serverCreatedDate.getMonth() + 1).toString().length > 1 ? (serverCreatedDate.getMonth() + 1).toString() : `0${(serverCreatedDate.getMonth() + 1).toString()}`);
        serverCreated = serverCreated.split("yy").join(serverCreatedDate.getFullYear());
        serverCreated = serverCreated.split("hour").join(serverCreatedDate.getHours().toString().length > 1 ? serverCreatedDate.getHours() : `0${serverCreatedDate.getHours().toString()}`);
        serverCreated = serverCreated.split("minute").join(serverCreatedDate.getMinutes().toString().length > 1 ? serverCreatedDate.getMinutes() : `0${serverCreatedDate.getMinutes().toString()}`);

        const serverInfoEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.serverinfo.embed.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.serverinfo.embed.description, [{GUILD_NAME: message.guild.name, GUILD_DESCRIPTION: (message.guild.description || handleMessage(client, message.member.user, undefined, message.channel, messages.general.serverinfo.embed["no-description"])).split("\n").join("> \n")}]))
        .setThumbnail(message.guild.iconURL({dynamic: true, size: 256}))
        .addFields([{
            name: messages.general.serverinfo.embed.fields.textChannel,
            value: message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText).size.toString(),
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.voiceChannel,
            value: message.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildVoice).size.toString(),
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.otherChannel,
            value: message.guild.channels.cache.filter(ch => [ChannelType.DM, ChannelType.GroupDM, ChannelType.GuildText, ChannelType.GuildVoice].indexOf(ch.type) < 0).size.toString(),
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.serverCreated,
            value: serverCreated,
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.serverOwner,
            value: `<@!${message.guild.ownerId}>`,
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.serverId,
            value: message.guild.id.toString(),
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.locale,
            value: message.guild.preferredLocale || 'Unknown locale',
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.boosts,
            value: message.guild.premiumSubscriptionCount.toString(),
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.icon,
            value: message.guild.icon ? `[png](${message.guild.iconURL({extension: 'png', size: 256})})\n[jpg](${message.guild.iconURL({extension: 'jpg', size: 256})})\n[gif](${message.guild.iconURL({extension: 'gif', size: 256})})` : `No available icon images`,
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.rolesCount,
            value: message.guild.roles.cache.size.toString(),
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.memberCount,
            value: (message.guild.memberCount - message.guild.members.cache.filter(m => m.user.bot).size).toString(),
            inline: true
        }, {
            name: messages.general.serverinfo.embed.fields.bots,
            value: message.guild.members.cache.filter(m => m.user.bot).size.toString(),
            inline: true
        }])
        .setImage(`attachment://memberCount-${message.guild.id}.png`)
        .setTimestamp();

        try {
            if(msg === null) await sendMessage({embeds: [serverInfoEmbed], files: [path.join(__dirname, `../../files/temporary/memberCount-${message.guild.id}.png`)]});
            else await replyMessage({embeds: [serverInfoEmbed], files: [path.join(__dirname, `../../files/temporary/memberCount-${message.guild.id}.png`)]});
        } catch {}

        fs.unlinkSync(path.join(__dirname, `../../files/temporary/memberCount-${message.guild.id}.png`));
    }
}
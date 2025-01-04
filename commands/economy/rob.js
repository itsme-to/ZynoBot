const { EmbedBuilder } = require("discord.js");
const economy_messages = require('./data/messages.json').rob;
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'rob',
        description: 'Rob someone from the server to earn money',
        options: [{type: 6, name: 'user', description: 'The user you want to rob', required: true}],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);
        
        const userEconomy = handle.getUser(client, message.member.id, message);
        const guildEconomy = userEconomy.filter(e => e.guild === message.guild.id)[0];

        const timestamp = new Date().getTime();

        if(guildEconomy.timeouts.rob > timestamp){
            const diff = guildEconomy.timeouts.rob - timestamp;
            const m = Math.ceil((diff / 60 / 1000));
            const wait = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].rob["wait-embed"].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].rob["wait-embed"].message, [{TIME: m}]))
            .setTimestamp();

            return sendMessage({embeds: [wait]}).catch(err => {});
        }

        const noMention = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].rob['no-mention'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].rob['no-mention'].message))
        .setTimestamp();

        if(interaction === false){
            if(!message.mentions.members.first()) return sendMessage({embeds: [noMention]}).catch(err => {});
        } else {
            if(!message.options.getUser('user')) return sendMessage({embeds: [noMention]}).catch(err => {});
        }

        var user = interaction === false ? message.mentions.members.first().user : message.options.getUser('user');

        const selfEmbed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].rob['rob-yourself'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].rob['rob-yourself'].message))
        .setTimestamp();

        if(user.id === message.member.id || user.bot) return sendMessage({embeds: [selfEmbed]}).catch(err => {});

        const robUser = handle.getUser(client, user.id, message);
        const robUserBalance = robUser.filter(e => e.guild === message.guild.id)[0];

        const robType = economy_messages[Math.round((Math.random() * (economy_messages.length - 1)))];
        var money = handle.getNumber(robType.min, robType.max);
        var outMoney = (money * -1);

        if(robType.positive === false){
            const maxOut = Math.round(guildEconomy.cash * 0.1) * -1;
            if(money < maxOut && guildEconomy.cash > 40){
                const percent = (Math.round(Math.random() * 30) + 10) / 100;
                money = (Math.round(guildEconomy.cash * percent)) * -1;
            } else if(guildEconomy.cash <= 40){
                money = 0;
            }
        } else {
            const maxOut = Math.round(robUserBalance.cash * 0.1) * -1;
            if(outMoney < maxOut && robUserBalance.cash > 40){
                const percent = (Math.round(Math.random() * 30) + 10) / 100;
                outMoney = (Math.round(robUserBalance.cash * percent)) * -1;
            } else if(robUserBalance.cash <= 40){
                outMoney = 0;
            }
        }

        var msg = robType.message.split('[MONEY]').join(`🪙 ${money}`).split('[USER]').join(`<@!${user.id}>`);
        if(msg.indexOf('[RANDOM]') >= 0){
            const rand = handle.getNumber(robType.random.min, robType.random.max);
            msg.split('[RANDOM]').join(rand);
        }

        const robEmbed = new EmbedBuilder()
        .setColor(robType.positive === true ? client.embedColor : `Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].rob['crime-title'], [{USERNAME: user.username}]))
        .setDescription(msg)
        .setTimestamp();

        guildEconomy.cash += money;
        guildEconomy.timeouts.rob = timestamp + 60 * 60 * 1000;
        robUserBalance.cash += outMoney;

        try{
            await client.dbHandler.setValue(`economy`, robUserBalance, {memberId: user.id, guildId: message.guild.id});
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
        } catch {}
        sendMessage({embeds: [robEmbed]}).catch(err => {});
    }
}
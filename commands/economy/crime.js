const { EmbedBuilder } = require("discord.js");
const economy_messages = require('./data/messages.json').crime;
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'crime',
        description: 'Commit a crime to earn money',
        options: [],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);
        
        const userEconomy = handle.getUser(client, message.member.id, message);
        const guildEconomy = userEconomy.filter(e => e.guild === message.guild.id)[0];

        const timestamp = new Date().getTime();

        if(guildEconomy.timeouts.crime > timestamp){
            const diff = guildEconomy.timeouts.crime - timestamp;
            const m = Math.ceil((diff / 60 / 1000));
            const wait = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].crime["wait-embed"].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].crime["wait-embed"].message, [{TIME: m}]))
            .setTimestamp();

            return sendMessage({embeds: [wait]}).catch(err => {});
        }

        const crimeType = economy_messages[Math.round((Math.random() * (economy_messages.length - 1)))];
        var money = handle.getNumber(crimeType.min, crimeType.max);

        if(crimeType.positive === false){
            const maxOut = Math.round(guildEconomy.cash * 0.1) * -1;
            if(money < maxOut && guildEconomy.cash > 40){
                const percent = (Math.round(Math.random() * 30) + 10) / 100;
                money = (Math.round(guildEconomy.cash * percent)) * -1
            } else if(guildEconomy.cash <= 40){
                money = 0;
            }
        }

        var msg = crimeType.message.split('[MONEY]').join(`🪙 ${money}`);
        if(msg.indexOf('[RANDOM]') >= 0){
            const rand = handle.getNumber(crimeType.random.min, crimeType.random.max);
            msg.split('[RANDOM]').join(rand);
        }

        const workEmbed = new EmbedBuilder()
        .setColor(crimeType.positive === true ? client.embedColor : `Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].crime["crime-title"]))
        .setDescription(msg)
        .setTimestamp();

        guildEconomy.cash += money;
        guildEconomy.timeouts.crime = timestamp + 60 * 60 * 1000;

        try{
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
        } catch {}
        sendMessage({embeds: [workEmbed]}).catch(err => {});
    }
}
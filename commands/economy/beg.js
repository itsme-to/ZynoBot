const { EmbedBuilder } = require("discord.js");
const economy_messages = require('./data/messages.json').beg;
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'beg',
        description: 'Beg for money to get money in the economy system',
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

        if(guildEconomy.timeouts.beg > timestamp){
            const diff = guildEconomy.timeouts.beg - timestamp;
            const m = Math.ceil((diff / 60 / 1000));
            const wait = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].beg["wait-embed"].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].beg["wait-embed"].message, [{TIME: m}]))
            .setTimestamp();

            return sendMessage({embeds: [wait]}).catch(err => {});
        }

        const begType = economy_messages[Math.round((Math.random() * (economy_messages.length - 1)))];
        const money = begType.positive === true ? handle.getNumber(begType.min, begType.max) : 0;

        var msg = begType.message.split('[MONEY]').join(`🪙 ${money}`);
        if(msg.indexOf('[RANDOM]') >= 0){
            const rand = handle.getNumber(begType.random.min, begType.random.max);
            msg.split('[RANDOM]').join(rand);
        }

        const workEmbed = new EmbedBuilder()
        .setColor(begType.positive === true ? client.embedColor : `Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].beg["beg-title"]))
        .setDescription(msg)
        .setTimestamp();

        guildEconomy.cash += money;
        guildEconomy.timeouts.beg = timestamp + 60 * 60 * 1000;

        try{
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
        } catch {}
        sendMessage({embeds: [workEmbed]}).catch(err => {});
    }
}
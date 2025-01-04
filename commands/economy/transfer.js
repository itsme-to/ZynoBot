const { EmbedBuilder } = require("discord.js");
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'transfer',
        description: 'Transfer your money to someone else their economy account',
        options: [{type: 6, name: 'user', description: 'The user you want to give money', required: true}, {type: 3, name: 'money', description: 'The money you want to transfer', required: true}],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const userEconomy = handle.getUser(client, message.member.id, message);
        const guildEconomy = userEconomy.filter(e => e.guild === message.guild.id)[0];

        const noMention = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].transfer["no-mention-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].transfer["no-mention-provided"].message))
        .setTimestamp();
        const noMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].transfer["no-money-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].transfer["no-money-provided"].message))
        .setTimestamp();
        const invalidMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].transfer["invalid-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].transfer["invalid-money"].message))
        .setTimestamp();
        const notEnough = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].transfer["not-enough-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].transfer["not-enough-money"].message))
        .setTimestamp();

        if(!(interaction === false ? message.mentions.members.first() : message.options.getUser(`user`))) return sendMessage({embeds: [noMention]}).catch(err => {});

        if(!args[2]) return sendMessage({embeds: [noMoney]}).catch(err => {});
        if(!Number(args[2]) && args[2].toLowerCase() !== 'all') return sendMessage({embeds: [invalidMoney]}).catch(err => {});
        if(args[2].toLowerCase() !== 'all') if(Number(args[2]) < 0 || Number(args[2]) > guildEconomy.cash) return sendMessage({embeds: [notEnough]}).catch(err => {});

        var user = interaction === false ? message.mentions.members.first().user : message.options.getUser(`user`);

        const transferUser = handle.getUser(client, user.id, message);
        const transferBalance = transferUser.filter(e => e.guild === message.guild.id)[0];

        if(args[2].toLowerCase() === 'all'){
            transferBalance.cash += guildEconomy.cash;
            guildEconomy.cash = 0;
        } else {
            var money = Number(args[2]);
            transferBalance.cash += money;
            guildEconomy.cash -= money;
        }

        const success = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages["economy-cmds"].transfer["transfer-success"].title))
        .setDescription(handleMessage(client, message.member.user, user, message.channel, messages["economy-cmds"].transfer["transfer-success"].message))
        .setTimestamp();

        try{
            await client.dbHandler.setValue(`economy`, transferBalance, {memberId: user.id, guildId: message.guild.id});
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
        } catch {}

        sendMessage({embeds: [success]}).catch(err => {});
    }
};
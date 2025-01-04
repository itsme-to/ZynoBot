const { EmbedBuilder } = require("discord.js");
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'dep',
        description: 'Deposit money to your bank',
        options: [{type: 3, name: 'money', description: 'The money you want to deposit to your bank', required: true}],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const userEconomy = handle.getUser(client, message.member.id, message);
        const guildEconomy = userEconomy.filter(e => e.guild === message.guild.id)[0];

        const noMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].deposit["no-money-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].deposit["no-money-provided"].message))
        .setTimestamp();
        const invalidMoney = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].deposit["invalid-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].deposit["invalid-money"].message))
        .setTimestamp();
        const notEnough = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].deposit["not-enough-money"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].deposit["not-enough-money"].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noMoney]}).catch(err => {});
        if(!Number(args[1]) && args[1].toLowerCase() !== 'all') return sendMessage({embeds: [invalidMoney]}).catch(err => {});
        if(args[1].toLowerCase() !== 'all') if(Number(args[1]) < 0 || Number(args[1]) > guildEconomy.cash) return sendMessage({embeds: [notEnough]}).catch(err => {});

        if(args[1].toLowerCase() === 'all'){
            guildEconomy.bank += guildEconomy.cash;
            guildEconomy.cash = 0;
        } else {
            var money = Number(args[1]);
            guildEconomy.bank += money;
            guildEconomy.cash -= money;
        }

        const success = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].deposit["deposit-success"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].deposit["deposit-success"].message))
        .setTimestamp();

        try{
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
        } catch {}

        sendMessage({embeds: [success]}).catch(err => {});
    }
};
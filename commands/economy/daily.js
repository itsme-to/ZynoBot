const { EmbedBuilder } = require("discord.js");
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'daily',
        description: 'Claim your daily bonus',
        options: [],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);
        
        const userEconomy = handle.getUser(client, message.member.id, message);
        const guildEconomy = userEconomy.filter(e => e.guild === message.guild.id)[0];

        const timestamp = new Date().getDate();

        if(guildEconomy.timeouts.daily === timestamp){
            const wait = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].daily["wait-embed"].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].daily["wait-embed"].message))
            .setTimestamp();

            return sendMessage({embeds: [wait]}).catch(err => {});
        }

        const bonus = messages["economy-cmds"].daily["claim-embed"].daily;

        const workEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].daily["claim-embed"].title, [{MONEY: `🪙 ${bonus}`}]))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].daily["claim-embed"].message, [{MONEY: `🪙 ${bonus}`}]))
        .setTimestamp();

        guildEconomy.cash += bonus;
        guildEconomy.timeouts.daily = timestamp;

        try{
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
        } catch {}
        sendMessage({embeds: [workEmbed]}).catch(err => {});
    }
}
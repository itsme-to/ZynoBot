const { EmbedBuilder } = require("discord.js");
const handle = require('../../handlers/economy.js');

module.exports = {
    data: {
        name: 'bal',
        description: 'Check your or someone else his/her balance in the economy system',
        options: [{type: 6, name: 'user', description: "The user who's balance you want to see", required: false}],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        var user;
        if(interaction === false){
            if(message.mentions.members.first()) user = message.mentions.members.first().user;
            else user = message.member.user;
        } else {
            if(message.options.getUser(`user`)) user = message.options.getUser(`user`);
            else user = message.member.user;
        }
        
        const userEconomy = handle.getUser(client, user.id, message).filter(e => e.guild === message.guild.id)[0];

        const balanceEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`${user.username}'s balance`)
        .addFields([
            {
                name: 'Bank',
                value: `🪙 ` + userEconomy.bank.toLocaleString('fullwide', {useGrouping: false}),
                inline: true
            }, {
                name: 'Cash',
                value: `🪙 ` + userEconomy.cash.toLocaleString('fullwide', {useGrouping: false}),
                inline: true
            }, {
                name: 'Total',
                value: `🪙 ` + (userEconomy.bank + userEconomy.cash).toLocaleString('fullwide', {useGrouping: false}),
                inline: true
            }
        ])
        .setTimestamp();

        sendMessage({embeds: [balanceEmbed]}).catch(err => {});
    }
}
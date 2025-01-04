const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'flip',
        description: 'Flip a coin',
        category: 'Fun',
        options: [{type: 3, name: 'coin', description: 'Whether you choose heads or tails', choices: [
            {
                name: 'Heads',
                value: 'heads'
            }, {
                name: 'Tails',
                value: 'tails'
            }
        ], required: true}],
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const emoji = {
            'heads': '🗣️',
            'tails': '🪙'
        };

        const choose = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.flip.choose.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.flip.choose.message))
        .setTimestamp();

        if(typeof emoji[(args[1] || '').toLowerCase()] !== 'string') return sendMessage({embeds: [choose]}).catch(err => {});

        var side = Object.keys(emoji);
        side = side[Math.round(Math.random() * (side.length - 1))];

        var result = handleMessage(client, message.member.user, undefined, message.channel, messages.fun.flip.result.status.lost);
        if(side === (args[1] || '').toLowerCase()) result = handleMessage(client, message.member.user, undefined, message.channel, messages.fun.flip.result.status.won);

        const resultEmbed = new EmbedBuilder()
        .setColor(result === handleMessage(client, message.member.user, undefined, message.channel, messages.fun.flip.result.status.lost) ? `Red` : client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.flip.result.title, [{STATUS: result.toLowerCase()}]))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun.flip.result.message, [{STATUS: result.toLowerCase(), RANDOM_SIDE: emoji[side], USER_SIDE: emoji[(args[1] || '').toLowerCase()]}]))
        .setTimestamp();

        sendMessage({embeds: [resultEmbed]}).catch(err => {});
    }
}
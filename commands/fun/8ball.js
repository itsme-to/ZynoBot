const { EmbedBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: '8ball',
        description: 'Play magic 8ball',
        options: [{type: 3, name: 'question', description: 'The question that the bot should answer', required: true}],
        category: 'Fun',
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noQuestion = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun['8ball']['no-question'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun['8ball']['no-question'].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noQuestion]}).catch(err => {});

        const response = messages.fun['8ball'].response[Math.round(Math.random() * (messages.fun['8ball'].response.length - 1))];

        const question = args.slice(1).join(" ").split("`").join("").slice(0, 50);

        const answerEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.fun['8ball'].embed.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.fun['8ball'].embed.message, [{QUESTION: question, ANSWER: response}]))
        .setTimestamp();

        sendMessage({embeds: [answerEmbed]}).catch(err => {});
    }
}
const { EmbedBuilder } = require('discord.js');
const handleMessage = require('../../handlers/handleMessages.js');
const messages = require('../../messages.json');

module.exports = {
    data: {
        name: 'avatar',
        description: 'Display your or someone else\'s avatar',
        options: [{type: 6, name: 'user', description: 'The user whose avatar you would like to see', required: false}],
        category: 'General',
        visible: true,
        defaultEnabled: false
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        var user;
        if(!interaction){
            if(message.mentions.members.size > 0){
                user = message.mentions.members.first().user || message.member.user;
            } else {
                user = message.member.user;
            }
        } else {
            if(message.options.getUser('user')){
                user = message.options.getUser('user');
            } else {
                user = message.member.user;
            }
        }

        let memberObj = message.guild.members.cache.get(user.id);

        if(!memberObj) return;

        const avatarEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.general.avatar.title))
        .addFields([{
            name: 'png format',
            value: `[[png]](${memberObj.displayAvatarURL({extension: 'png'})})`,
            inline: true
        },
        {
            name: 'jpg format',
            value: `[[jpg]](${memberObj.displayAvatarURL({extension: 'jpg'})})`,
            inline: true
        },
        {
            name: 'jpeg format',
            value: `[[jpeg]](${memberObj.displayAvatarURL({extension: 'jpeg'})})`,
            inline: true
        },
        {
            name: 'webp format',
            value: `[[webp]](${memberObj.displayAvatarURL({extension: 'webp'})})`,
            inline: true
        },
        {
            name: 'gif format',
            value: `[[gif]](${memberObj.displayAvatarURL({extension: 'gif'})})`,
            inline: true
        }])
        .setThumbnail(memberObj.displayAvatarURL({dynamic: true}))
        .setTimestamp();

        sendMessage({embeds: [avatarEmbed]}).catch(err => {});
    }
}
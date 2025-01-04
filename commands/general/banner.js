const { EmbedBuilder } = require('discord.js');
const handleMessage = require('../../handlers/handleMessages.js');
const messages = require('../../messages.json');

module.exports = {
    data: {
        name: 'banner',
        description: 'Display your or someone else\'s banner',
        options: [{type: 6, name: 'user', description: 'The user whose banner you would like to see', required: false}],
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

        let bannerURL = user.bannerURL();

        const noBanner = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.general.banner['no-banner'].title))
        .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.general.banner['no-banner'].message))
        .setTimestamp();

        if(!bannerURL) return sendMessage({embeds: [noBanner]}).catch(err => {});

        const avatarEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.general.banner.banner.title))
        .addFields([{
            name: 'png format',
            value: `[[png]](${user.bannerURL({extension: 'png', size: 256})})`,
            inline: true
        },
        {
            name: 'jpg format',
            value: `[[jpg]](${user.bannerURL({extension: 'jpg', size: 256})})`,
            inline: true
        },
        {
            name: 'jpeg format',
            value: `[[jpeg]](${user.bannerURL({extension: 'jpeg', size: 256})})`,
            inline: true
        },
        {
            name: 'webp format',
            value: `[[webp]](${user.bannerURL({extension: 'webp', size: 256})})`,
            inline: true
        },
        {
            name: 'gif format',
            value: `[[gif]](${user.bannerURL({extension: 'gif', size: 256})})`,
            inline: true
        }])
        .setThumbnail(user.bannerURL({dynamic: true, size: 256}))
        .setTimestamp();

        sendMessage({embeds: [avatarEmbed]}).catch(err => {});
    }
}
const { EmbedBuilder } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { getXPForLevel } = require('../../functions.js');

module.exports = {
    data: {
        name: 'xp',
        description: "See your or someone else's xp",
        category: 'Level',
        options: [{type: 6, name: 'user', description: "The user whose xp you want to see", required: false}],
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        var user;
        if(interaction === false) user = message.mentions.members.first() ? message.mentions.members.first().user : message.member.user;
        else user = message.options.getUser(`user`) ? message.options.getUser(`user`) : message.member.user;

        var xp = client.deepCopy(client.xp.get(user.id) || [{messages: 0, level: 0, xp: 0, guild: message.guild.id}]).filter(e => e.guild === message.guild.id)[0] || {messages: 0, level: 0, xp: 0, guild: message.guild.id};

        if(typeof xp.xp !== 'number'){
            xp['xp'] = getXPForLevel(xp['level'], message.guild.id);
            try{
                await client.dbHandler.xpHandler(xp, {memberId: user.id, guildId: message.guild.id});
            } catch {}
        }

        const xpEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.level["user-xp"].title))
        .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.level["user-xp"].message, [{XP: typeof xp.xp === 'number' ? xp.xp : getXPForLevel(xp.level, message.guild.id)}]))
        .setTimestamp();

        sendMessage({embeds: [xpEmbed]}).catch(err => {});
    }
}
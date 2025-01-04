const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'userinfo',
        description: 'Get information about a user',
        options: [{type: 6, name: 'user', description: 'The user whose information you want to see', required: false}],
        category: 'Moderation',
        permissions: 'ModerateMembers',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.userinfo['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.userinfo['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});
        
        var user;
        if(interaction === false){
            if(message.mentions.members.first()) user = message.mentions.members.first().user;
            else user = message.author;
        } else {
            var _u = message.options.getUser('user');
            if(_u) user = _u;
            else user = message.member.user;
        }

        const getUserInfo = client.userinfo.get(user.id);
        let userInfo = client.deepCopy(getUserInfo || [{joins: 1, bans: 0, kicks: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: message.guild.id}]).filter(u => u.guild === message.guild.id)[0] || {joins: 1, bans: 0, kicks: 0, mutes: 0, invites: 0, inviteleaves: 0, invitedBy: null, guild: message.guild.id};
        const xp = client.deepCopy(client.xp.get(user.id) || [{level: 0, messages: 0, guild: message.guild.id}]).filter(u => u.guild === message.guild.id)[0] || {level: 0, messages: 0, xp: 0, guild: message.guild.id};

        if(typeof userInfo.invites !== 'number' || typeof userInfo.inviteleaves !== 'number' || typeof userInfo.invitedBy === 'undefined'){
            userInfo.invites = userInfo.invites || 0;
            userInfo.inviteleaves = userInfo.inviteleaves || 0;
            userInfo.invitedBy = userInfo.invitedBy || null;
            try{
                await client.dbHandler.setValue(`userinfo`, userInfo, {memberId: user.id, guildId: message.guild.id});
            } catch {}
        }

        client.cache.getMember(user.id, message.guild).then(member => {

            const userInfoEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setTitle(handleMessage(client, message.member.user, user, message.channel, messages.moderation.userinfo.message.title))
            .setThumbnail(member.user.displayAvatarURL({dynamic: true}))
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setDescription(handleMessage(client, message.member.user, user, message.channel, messages.moderation.userinfo.message.message, [{MESSAGES: xp.messages, JOINS: userInfo.joins, BANS: userInfo.bans, KICKS: userInfo.kicks, MUTES: userInfo.mutes, INVITES: userInfo.invites, INVITELEAVES: userInfo.inviteleaves, TOTALINVITES: (userInfo.invites - userInfo.inviteleaves)}]))
            .setFields([{
                inline: true,
                name: 'Username',
                value: member.user.username
            }, {
                inline: true,
                name: 'Nickname',
                value: member.nickname ? member.nickname : 'No nickname'
            }, {
                inline: true,
                name: 'User id',
                value: member.id
            }, {
                inline: true,
                name: 'Joined on',
                value: `<t:${Math.round(member.joinedTimestamp / 1000)}>`
            }, {
                inline: true,
                name: 'Created account on',
                value: `<t:${Math.round(member.user.createdTimestamp / 1000)}>`
            }, {
                inline: true,
                name: 'Invited by',
                value: `${typeof userInfo.invitedBy === 'string' ? `<@!${userInfo.invitedBy}>` : `Unknown`}`
            }])
            .setTimestamp();

            sendMessage({embeds: [userInfoEmbed]}).catch(err => {});
        }).catch(err => {
            console.log(`Error while trying to get member: `, err);
        });
    }
};
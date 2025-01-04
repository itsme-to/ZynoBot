const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'nickname',
        description: 'Change someone\'s nickname',
        options: [{type: 6, name: 'user', description: 'Who\'s nickname you want to change', required: true}, {type: 3, name: 'nickname', description: 'The new nickname', required: false}],
        category: 'Moderation',
        visible: true,
        defaultEnabled: false,
        permissions: 'ManageNicknames'
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPermissions = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.nickname['no-permissions'].title, [{PERMISSIONS: data.permissions}]))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.nickname['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();
        
        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPermissions]});

        const noMention = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.nickname['mention-user'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.nickname['mention-user'].message))
        .setTimestamp();

        let member;
        if(interaction === false){
            if(message.mentions.members.size === 0) return sendMessage({embeds: [noMention]}).catch(err => {});
            member = message.mentions.members.first();
        } else {
            let user = message.options.getUser('user');
            member = await client.cache.getMember(user.id, message.guild);
            if(!member) return sendMessage({embeds: [noMention]}).catch(err => {});
        }

        let newNickname = null;
        if(args.length > 2){
            newNickname = args.slice(2).join(" ");
        }

        member.setNickname(newNickname, `Nickname changed by ${message.member.user.username}`).then(() => {

            const success = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.nickname['changed-nickname'].title, [{NEW_NICKNAME: newNickname || member.user.username}]))
            .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.nickname['changed-nickname'].message, [{NEW_NICKNAME: newNickname || member.user.username}]))
            .setTimestamp();

            sendMessage({embeds: [success]}).catch(err => {});

        }).catch(err => {
            console.log(`Error while changing nickname:`, err);

            const unknownErr = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.nickname['unknown-error'].title))
            .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.nickname['unknown-error'].message))
            .setTimestamp();

            sendMessage({embeds: [unknownErr]}).catch(err => {});
        });
    }
}
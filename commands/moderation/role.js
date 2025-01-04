const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");

module.exports = {
    data: {
        name: 'role',
        description: 'Give or remove a role from someone',
        options: [{type: 6, name: 'user', description: 'The user who you want to give or remove a role from', required: true}, {type: 8, name: 'role', description: 'The role to give or remove', required: true}],
        category: 'Moderation',
        defaultEnabled: false,
        permissions: 'ManageRoles'
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        var user, role;
        if(interaction === false){
            user = message.mentions.members.first();
            role = message.mentions.roles.first();
            const noMention = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['no-mention'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['no-mention'].message))
            .setTimestamp();

            if(!user || !role) return sendMessage({embeds: [noMention]}).catch(err => {});

            user = user.user;
        } else {
            user = message.options.getUser(`user`);
            role = message.options.getRole(`role`);
        }

        const unknownErr = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['error'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['error'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        var member;
        try {
            member = await client.cache.getMember(user.id, message.guild);
            if(!member) return sendMessage({embeds: [unknownErr]}).catch(err => {});
        } catch {
            return sendMessage({embeds: [unknownErr]}).catch(err => {});
        }

        const highestRoleMember = Array.from(member.roles.cache.values()).sort((a, b) => {
            return b.position - a.position;
        })[0];

        const highestRole = Array.from(message.member.roles.cache.values()).sort((a, b) => {
            return b.position - a.position;
        })[0];

        const roleMemberHigher = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['role-member-higher'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['role-member-higher'].message))
        .setTimestamp();

        if(highestRoleMember.position > highestRole.position) return sendMessage({embeds: [roleMemberHigher]}).catch(err => {});

        const roleHigher = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['role-higher'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.role['error-messages']['role-higher'].message))
        .setTimestamp();

        if(role.position > highestRole.position) return sendMessage({embeds: [roleHigher]}).catch(err => {});

        var add = member.roles.cache.get(role.id) ? false : true;
        if(add === true){
            member.roles.add(role.id).then(() => {
                const added = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.role.success.title, [{ACTION: messages.moderation.role.success.actions.add}]))
                .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.role.success.message, [{ACTION: messages.moderation.role.success.actions.add, TO_OR_FROM: messages.moderation.role.success.to, ROLE_MENTION: `<@&${role.id}>`}]))
                .setTimestamp();

                sendMessage({embeds: [added]}).catch(err => {});
            }).catch(err => {
                console.log(`Error while adding role ${role.name} to ${member.user.username}:`, err);

                sendMessage({embeds: [unknownErr]}).catch(err => {});
            });
        } else {
            member.roles.remove(role.id).then(() => {
                const removed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.role.success.title, [{ACTION: messages.moderation.role.success.actions.remove}]))
                .setDescription(handleMessage(client, message.member.user, member.user, message.channel, messages.moderation.role.success.message, [{ACTION: messages.moderation.role.success.actions.remove, TO_OR_FROM: messages.moderation.role.success.from, ROLE_MENTION: `<@&${role.id}>`}]))
                .setTimestamp();

                sendMessage({embeds: [removed]}).catch(err => {});
            }).catch(err => {
                console.log(`Error while removing role ${role.name} to ${member.user.username}:`, err);

                sendMessage({embeds: [unknownErr]}).catch(err => {});
            });
        }
    }
}
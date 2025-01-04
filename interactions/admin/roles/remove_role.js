const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'select-remove-special-role',
        description: 'When the special role gets selected which should be removed'
    },
    run: async function(client, interaction){
        const roleId = interaction.values[0].toLowerCase();

        if(roleId === 'cancel'){
            const cancelEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Cancelled action`)
            .setDescription(`The action to remove a special role has been cancelled`)
            .setTimestamp();

            return interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
        }

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        const roleInfo = client.interactionActions.get(`change-special-role-${interaction.member.id}-${interaction.guild.id}`);
        if(!roleInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const roleNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Role not set`)
        .setDescription(`The role <@&${roleId}> has not been set as a ${roleInfo.type} role'.`)
        .setTimestamp();

        switch(roleInfo.type){
            case 'join':
                const joinroleIndex = (client.config.joinRoles[interaction.guild.id] || []).indexOf(roleId.toString());
                if(joinroleIndex < 0) return interaction.update({embeds: [roleNotFound], components: []}).catch(err => {});

                client.config.joinRoles[interaction.guild.id].splice(joinroleIndex, 1);
                configHandler(client, client.config);
                break;
            case 'moderator':
                const moderatorroleIndex = (client.config.moderator_roles[interaction.guild.id] || []).indexOf(roleId.toString());
                if(moderatorroleIndex < 0) return interaction.update({embeds: [roleNotFound], components: []}).catch(err => {});

                client.config.moderator_roles[interaction.guild.id].splice(moderatorroleIndex, 1);
                configHandler(client, client.config);
                break;
            case 'ticket':
                const ticketroleIndex = (client.config.tickets.roles[interaction.guild.id] || []).indexOf(roleId.toString());
                if(ticketroleIndex < 0) return interaction.update({embeds: [roleNotFound], components: []}).catch(err => {});

                client.config.tickets.roles[interaction.guild.id].splice(ticketroleIndex, 1);
                configHandler(client, client.config);
                break;
            case 'anti-filter':
                let antiFilterRoles = client.deepCopy((client.globals.get(`anti-filter-roles`) || {}));
                let antiFilterGuildRoles = antiFilterRoles[interaction.guild.id] || [];
                const antiFilterRoleIndex = antiFilterGuildRoles.indexOf(roleId.toString());
                if(antiFilterRoleIndex < 0) return interaction.update({embeds: [roleNotFound], components: []}).catch(err => {});

                antiFilterGuildRoles.splice(antiFilterRoleIndex, 1);
                antiFilterRoles[interaction.guild.id] = antiFilterGuildRoles;
                try{
                    await client.dbHandler.setValue('globals', antiFilterRoles, {'globalsKey': 'anti-filter-roles'})
                } catch {}
                break;
        }

        const roleRemoved = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Role removed`)
        .setDescription(`The role <@&${roleId}> has successfully been removed as a ${roleInfo.type} role.`)
        .setTimestamp();

        return interaction.update({embeds: [roleRemoved], components: []}).catch(err => {});
    }
}
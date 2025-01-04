const { EmbedBuilder } = require("discord.js");
const configHandler = require('../../../handlers/saveConfig.js');

function firstUpperCase(string){
    let firstletter = string.slice(0, 1).toUpperCase();
    let newstring = firstletter + string.slice(1, string.length);
    return newstring;
}

module.exports = {
    data: {
        id: 'confirm-special-role',
        description: 'When the role has been confirmed'
    },
    run: async function(client, interaction){
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        const roleInfo = client.interactionActions.get(`change-special-role-${interaction.member.id}-${interaction.guild.id}`);

        if(!roleInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const maxAmount = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Max amount of roles`)
        .setDescription(`You have already reached the max amount of special roles for the ${roleInfo.type} roles of 10.`)
        .setTimestamp();
        
        switch(roleInfo.type){
            case 'join':
                if(client.config.joinRoles[interaction.guild.id].length >= 10) return interaction.update({embeds: [maxAmount]}).catch(err => {});
                client.config.joinRoles[interaction.guild.id].push(roleInfo.role.id.toString());

                configHandler(client, client.config);
                break;
            case 'moderator':
                if(client.config.moderator_roles[interaction.guild.id].length >= 10) return interaction.update({embeds: [maxAmount]}).catch(err => {});
                client.config.moderator_roles[interaction.guild.id].push(roleInfo.role.id.toString());

                configHandler(client, client.config);
                break;
            case 'ticket':
                if(client.config.tickets.roles[interaction.guild.id].length >= 10) return interaction.update({embeds: [maxAmount]}).catch(err => {});
                client.config.tickets.roles[interaction.guild.id].push(roleInfo.role.id.toString());

                configHandler(client, client.config);
                break;
            case 'anti-filter':
                let antiFilterRoles = client.deepCopy((client.globals.get(`anti-filter-roles`) || {}));
                let antiFilterGuildRoles = antiFilterRoles[interaction.guild.id] || [];
                if(antiFilterGuildRoles.length >= 10) return interaction.update({embeds: [maxAmount]}).catch(err => {});
                
                antiFilterGuildRoles.push(roleInfo.role.id.toString());
                antiFilterRoles[interaction.guild.id] = antiFilterGuildRoles;
                try{
                    await client.dbHandler.setValue('globals', antiFilterRoles, {'globalsKey': 'anti-filter-roles'});
                } catch {}
                break;
        }

        const confirmed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`${firstUpperCase(roleInfo.type)} role added`)
        .setDescription(`The ${roleInfo.type} role (<@&${roleInfo.role.id}>) has successfully been added`)
        .setTimestamp();

        client.interactionActions.delete(`change-special-role-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [confirmed], components: []}).catch(err => {});
    }
}
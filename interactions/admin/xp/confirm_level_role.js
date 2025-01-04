const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-level-role',
        description: 'When the role gets confirmed as the level role'
    },
    run: async function(client, interaction){
        const levelRoleInfo = client.interactionActions.get(`level-role-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!levelRoleInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const rolesAdd = client.deepCopy((client.globals.get('level-roles') || {}))[interaction.guild.id] || {};
        if(Object.keys(rolesAdd).length >= 10){
            const noLevelRoles = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Max reached`)
            .setDescription(`You already have reached the maximum amount of level roles of 10.`)
            .setTimestamp();

            interaction.update({embeds: [noLevelRoles], components: []}).catch(err => {});
        }

        rolesAdd[levelRoleInfo.level.toString()] = levelRoleInfo.role;

        let levelRoles = client.deepCopy((client.globals.get('level-roles') || {}));
        levelRoles[interaction.guild.id] = rolesAdd;
        try{
            await client.dbHandler.setValue('globals', levelRoles, {'globalsKey': 'level-roles'});
        } catch {}

        const levelRoleSet = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle('Level role added')
        .setDescription('The level role has successfully been added.')
        .setTimestamp();

        return interaction.update({embeds: [levelRoleSet], components: []}).catch(err => {});
    }
}
const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'remove-level-role',
        description: 'Removes the selected level role'
    },
    run: async function(client, interaction){
        const levelRole = interaction.values[0].toLowerCase();

        const rolesRemove = client.deepCopy((client.globals.get('level-roles') || {}))[interaction.guild.id] || {};
        delete rolesRemove[levelRole];

        let levelRoles = client.deepCopy((client.globals.get('level-roles') || {}));
        levelRoles[interaction.guild.id] = rolesRemove;
        try{
            await client.dbHandler.setValue('globals', levelRoles, {'globalsKey': 'level-roles'});
        } catch {}

        const levelRoleRemoved = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Level role removed`)
        .setDescription(`The level role has successfully been removed.`)
        .setTimestamp();

        interaction.update({embeds: [levelRoleRemoved], components: []}).catch(err => {});
    }
}
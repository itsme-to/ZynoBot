const { EmbedBuilder } = require("discord.js");
const { wait } = require("../../../functions.js");

module.exports = {
    data: {
        id: 'select-level-input',
        description: 'When the new level gets provided'
    },
    run: async function(client, interaction){
        const levelMember = client.interactionActions.get(`level-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!levelMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const newLevel = interaction.fields.getTextInputValue('level-input');
        if(!/^[0-9]*$/.test(newLevel)){
            const invalidLevel = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle('Invalid level')
            .setDescription(`The new level must be a number.`)
            .setTimestamp();

            return interaction.update({embeds: [invalidLevel], components: []});
        }

        const newMemberXP = client.getXPForLevel(parseInt(newLevel), interaction.guild.id);
        
        const getUserXP = client.xp.get(levelMember.id);
        let userXP = client.deepCopy(getUserXP || [{level: 0, messages: 0, xp: 0, guild: interaction.guild.id}]).filter(u => u.guild === interaction.guild.id)[0] || {level: 0, messages: 0, xp: 0, guild: interaction.guild.id};
        userXP['xp'] = newMemberXP;
        const oldLevel = userXP['level'];
        userXP['level'] = parseInt(newLevel);

        try{
            await client.dbHandler.xpHandler(userXP, {memberId: levelMember.id, guildId: interaction.guild.id});
        } catch {}

        const levelUpdated = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Level updated`)
        .setDescription(`<@!${levelMember.id}>'s level has successfully been updated.`)
        .setTimestamp();

        interaction.update({embeds: [levelUpdated], components: []}).catch(err => {});

        client.interactionActions.delete(`level-member-${interaction.member.id}-${interaction.guild.id}`);
        
        if(userXP['level'] > oldLevel){
            let levelRoles = client.deepCopy((client.globals.get('level-roles') || {}));
            let levelRolesGuild = levelRoles[interaction.guild.id] || {};
            for(let i = oldLevel + 1; i <= userXP['level']; i++){
                let levelRole = levelRolesGuild[i.toString()];
                if(!levelRole) continue;
                if(levelMember.roles.cache.get(levelRole)) continue;
                try{
                    await levelMember.roles.add(levelRole);
                    await wait(4e2);
                } catch (err){
                    console.log(err);
                }
            }
        }
    }
}
const { EmbedBuilder } = require("discord.js");
const { getXPForLevel, wait } = require("../../../functions.js");

module.exports = {
    data: {
        id: 'add-xp-balance',
        description: "When the amount of xp to add for the user's xp gets provided"
    },
    run: async function(client, interaction){
        const xpMember = client.interactionActions.get(`xp-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!xpMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const amount = interaction.fields.getTextInputValue('add-amount');

        const regEx = /^[0-9]*$/;
        if(!regEx.test(amount)){
            const invalidAmount = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Invalid amount`)
            .setDescription(`The amount of xp must be a number`)
            .setTimestamp();

            return interaction.update({embeds: [invalidAmount], components: []}).catch(err => {});
        }

        const xpSave = client.deepCopy(client.xp.get(xpMember.id) || [{xp: 0, level: 0, messages: 0, guild: interaction.guild.id}]);
        const xp = xpSave.filter(e => e.guild === interaction.guild.id)[0] || {xp: 0, level: 0, messages: 0, guild: interaction.guild.id};
        const xpIndex = xpSave.indexOf(xp);

        if(typeof xp.xp !== 'number') xp.xp = 0;
        xp.xp += parseInt(amount);

        const oldLevel = xp.level;

        while(getXPForLevel(xp.level, interaction.guild.id) < xp.xp){
            xp.level += 1;
        }
        xp.level -= 1;

        try{
            await client.dbHandler.xpHandler(xp, {memberId: xpMember.id, guildId: interaction.guild.id});
        } catch {}
        

        const saved = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`XP updated`)
        .setDescription(`<@!${xpMember.id}>'s xp has successfully been changed by ${amount} xp`)
        .setTimestamp();

        client.interactionActions.delete(`xp-member-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [saved], components: []}).catch(err => {});

        if(xp['level'] > oldLevel){
            let levelRoles = client.deepCopy((client.globals.get('level-roles') || {}));
            let levelRolesGuild = levelRoles[interaction.guild.id] || {};
            for(let i = oldLevel + 1; i <= xp['level']; i++){
                let levelRole = levelRolesGuild[i.toString()];
                if(!levelRole) continue;
                if(xpMember.roles.cache.get(levelRole)) continue;
                try{
                    await xpMember.roles.add(levelRole);
                    await wait(4e2);
                } catch (err){
                    console.log(err);
                }
            }
        }
    }
}
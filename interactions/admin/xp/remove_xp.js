const { EmbedBuilder } = require("discord.js");
const { getXPForLevel } = require("../../../functions");

module.exports = {
    data: {
        id: 'remove-xp-balance',
        description: "When the amount of coins to remove from the user's balance gets provided"
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

        const amount = interaction.fields.getTextInputValue('remove-amount');

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

        if(xp.xp < parseInt(amount)){
            xp.xp = 0;
        } else {
            xp.xp -= amount;
        }
        
        while(getXPForLevel(xp.level, interaction.guild.id) > xp.xp){
            xp.level -= 1;
        }

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
    }
}
const { EmbedBuilder } = require("discord.js");
const handle = require('../../../handlers/economy.js');

module.exports = {
    data: {
        id: 'add-economy-balance',
        description: "When the amount of coins to add for the user's balance gets provided"
    },
    run: async function(client, interaction){
        const economyMember = client.interactionActions.get(`economy-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!economyMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const userEconomy = handle.getUser(client, economyMember.id, interaction);
        const guildEconomy = userEconomy.filter(e => e.guild === interaction.guild.id)[0];

        const amount = interaction.fields.getTextInputValue('add-amount');

        const regEx = /^[0-9]*$/;
        if(!regEx.test(amount)){
            const invalidAmount = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Invalid amount`)
            .setDescription(`The amount of coins must be a number`)
            .setTimestamp();

            return interaction.update({embeds: [invalidAmount], components: []}).catch(err => {});
        }

        guildEconomy.cash += Number(amount);
        
        try{
            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: economyMember.id, guildId: interaction.guild.id});
        } catch {}
        const saved = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Balance updated`)
        .setDescription(`<@!${economyMember.id}>'s balance has successfully been changed by ${amount} coins`)
        .setTimestamp();

        client.interactionActions.delete(`economy-member-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [saved], components: []}).catch(err => {});
    }
}
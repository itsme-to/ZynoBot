const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-badword-action',
        description: 'When the badword gets confirmed'
    },
    run: async function(client, interaction){
        const badword = client.interactionActions.get(`badword-change-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!badword) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const badwordTooLong = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle('Badword too long')
        .setDescription('The badwoord is too long. Badwords may maximum include 200 characters.')
        .setTimestamp();

        if(badword.length > 200){
            client.interactionActions.delete(`badword-change-${interaction.member.id}-${interaction.guild.id}`);
            return interaction.update({embeds: [badwordTooLong], components: []}).catch(err => {});
        }

        const badwords = client.deepCopy(client.badwords.get(interaction.guild.id) ?? []);
        const exists = (badwords || []).indexOf(badword.toLowerCase()) >= 0 ? true : false;

        if(exists){
            try{
                await client.dbHandler.deleteValue(`badwords`, badword.toLowerCase(), {guildId: interaction.guild.id});
            } catch {}
        } else {
            try{
                await client.dbHandler.setValue(`badwords`, badword.toLowerCase(), {guildId: interaction.guild.id});
            } catch {}
        }

        client.interactionActions.delete(`badword-change-${interaction.member.id}-${interaction.guild.id}`);

        const savedEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Word ${exists ? `saved` : `deleted`}`)
        .setDescription(`The word `+"`"+badword+"`"+` has successfully been ${exists === true ? `deleted from` : `added to`} the bad word filter`)
        .setTimestamp();

        interaction.update({embeds: [savedEmbed], components: []}).catch(err => {});
    }
}
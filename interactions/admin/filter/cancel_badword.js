const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-badword-action',
        description: 'When the channel has been cancelled as the leave channel'
    },
    run: function(client, interaction){
        const badword = client.interactionActions.get(`badword-change-${interaction.member.id}-${interaction.guild.id}`);
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        if(!badword) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const exists = client.deepCopy(client.badwords.get(interaction.guild.id) ?? []).indexOf(badword.toLowerCase()) >= 0;

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Cancelled action`)
        .setDescription(`The action to ${exists === true ? `remove` : `add`} the word `+"`"+badword+"`"+` ${exists === true ? `from` : `to`} the bad word filter has been cancelled`)
        .setTimestamp();
        
        client.interactionActions.delete(`badword-change-${interaction.member.id}-${interaction.guild.id}`);

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}
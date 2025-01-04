const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    data: {
        id: 'change-word-badword-filter',
        description: 'When the word that needs to be changed for the bad word filter gets provided'
    },
    run: function(client, interaction){
        const word = interaction.fields.getTextInputValue('input-badword');

        const remove = client.deepCopy(client.badwords.get(interaction.guild.id) || []).indexOf(word.toLowerCase()) >= 0 ? true : false;

        const confirmEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Confirm your action`)
        .setDescription(`Are you sure that you want to **${remove === true ? `remove` : `add`}** the word `+"`"+word+"`"+` ${remove === true ? `from` : `to`} the bad word filter?`)
        .setTimestamp();

        const confirmBtn = new ButtonBuilder()
        .setCustomId(`confirm-badword-action`)
        .setLabel(`Confirm`)
        .setStyle(ButtonStyle.Success);
        const cancelBtn = new ButtonBuilder()
        .setCustomId(`cancel-badword-action`)
        .setLabel(`Cancel`)
        .setStyle(ButtonStyle.Danger);

        const buttonActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

        interaction.update({embeds: [confirmEmbed], components: [buttonActionRow]}).then(() => {
            client.interactionActions.set(`badword-change-${interaction.member.id}-${interaction.guild.id}`, word);
        }).catch(err => {});
    }
}
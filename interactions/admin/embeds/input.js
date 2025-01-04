const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'change-embed-color',
        description: 'When the new color code gets provided'
    },
    run: function(client, interaction){
        const colorCode = interaction.fields.getTextInputValue(`color-input`);

        let colorRegEx = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if(!colorRegEx.test(colorCode)){
            const wrongColor = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Invalid color code`)
            .setDescription(`The provided color code is not a HEX color code`)
            .setTimestamp();

            return interaction.reply({embeds: [wrongColor], ephemeral: true}).catch(err => {});
        }

        const confirmBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setLabel(`Confirm`)
        .setCustomId(`confirm-color-code`);
        const cancelBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel(`Cancel`)
        .setCustomId(`cancel-color-code`);

        const colorActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

        const confirmEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Confirm your action`)
        .setDescription(`Are you sure that you want to change the embed color to HEX color code `+"`"+colorCode+"`?")
        .setTimestamp();

        client.interactionActions.set(`change-color-code-${interaction.member.id}`, colorCode);
        interaction.update({embeds: [confirmEmbed], components: [colorActionRow]}).catch(err => {});
    }
}
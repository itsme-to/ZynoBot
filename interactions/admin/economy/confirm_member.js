const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder  } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-economy-member',
        description: 'When the economy member gets confirmed'
    },
    run: function(client, interaction){
        const economyMember = client.interactionActions.get(`economy-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!economyMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const action = new StringSelectMenuBuilder()
        .setCustomId(`select-economy-action`)
        .setPlaceholder(`No option selected`)
        .setOptions([{
            label: 'Add coins',
            value: 'add',
            description: "Add coins to the user's balance"
        }, {
            label: 'Remove coins',
            value: 'remove',
            description: "Remove coins from the user's balance"
        }, {
            label: 'Cancel',
            value: 'cancel',
            description: 'Cancel this action'
        }]);
        const actionRow = new ActionRowBuilder().addComponents(action);

        const select = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Select action`)
        .setDescription(`Please select which action needs to be executed`)
        .setTimestamp();

        interaction.update({embeds: [select], components: [actionRow]}).catch(err => {});
    }
}
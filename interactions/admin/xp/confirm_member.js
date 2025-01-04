const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder  } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-xp-member',
        description: 'When the xp member gets confirmed'
    },
    run: function(client, interaction){
        const xpMember = client.interactionActions.get(`xp-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!xpMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const action = new StringSelectMenuBuilder()
        .setCustomId(`select-xp-action`)
        .setPlaceholder(`No option selected`)
        .setOptions([{
            label: 'Add xp',
            value: 'add',
            description: "Add xp to the user's xp"
        }, {
            label: 'Remove xp',
            value: 'remove',
            description: "Remove xp from the user's xp"
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
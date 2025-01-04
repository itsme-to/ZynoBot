const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder  } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-economy-inventory-member',
        description: 'When the member confirms the member who\'s inventory should be changed'
    },
    run: function(client, interaction){
        const inventoryMember = client.interactionActions.get(`change-inventory-member-${interaction.member.id}-${interaction.guild.id}`);
        
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!inventoryMember) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const action = new StringSelectMenuBuilder()
        .setCustomId(`select-economy-inventory-action`)
        .setPlaceholder(`No option selected`)
        .setOptions([{
            label: 'Add an item',
            value: 'add',
            description: "Add an item to the member's inventory"
        }, {
            label: 'Remove an item',
            value: 'remove',
            description: "Remove an item from the member's inventory"
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
        .setDescription(`Please select the action you\'d like to perform in the select menu below`)
        .setTimestamp();

        interaction.update({embeds: [select], components: [actionRow]}).catch(err => {});
    }
}
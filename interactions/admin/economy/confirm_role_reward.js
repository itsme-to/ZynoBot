const { EmbedBuilder } = require("discord.js");
const { genRandString } = require("../../../functions");

module.exports = {
    data: {
        id: 'confirm-role-item-reward',
        description: 'When a member confirms the role to be given as a reward for the new shop item'
    },
    run: async function(client, interaction){
        const interactionInfo = client.interactionActions.get(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!interactionInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const identifier = interaction.customId.split('__')[1];

        let shopItems = client.deepCopy(client.shop.get(interaction.guild.id) ?? []);

        let newIdentifier;
        if(identifier){
            newIdentifier = identifier;
        } else {
            newIdentifier = genRandString(15);
            while(shopItems.filter(s => s.identifier === newIdentifier).length > 0){
                newIdentifier = genRandString(15);
            }
            newIdentifier = newIdentifier.toLowerCase();
        }
        try{
            await client.dbHandler.setValue(`shop`, {...interactionInfo, identifier: newIdentifier}, {identifier: newIdentifier, guildId: interaction.guild.id});
        } catch(err) {
            console.log(err);
        }

        client.interactionActions.delete(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`);

        const itemAdded = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Item added`)
        .setDescription(`The item has successfully been added to the shop.`)
        .setTimestamp();

        interaction.update({embeds: [itemAdded], components: []}).catch(err => {});
    }
}
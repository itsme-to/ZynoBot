const { EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } = require("discord.js");
const { genRandString } = require("../../../functions");

module.exports = {
    data: {
        id: 'reward-new-shop-item',
        description: 'When the member provides the type of reward anyone should receive by purchasing the new item'
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

        const reward = interaction.values[0].toLowerCase();

        let shopItems = client.deepCopy(client.shop.get(interaction.guild.id) ?? []);

        switch(reward){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to add a new item to the shop has been cancelled`)
                .setTimestamp();

                client.interactionActions.delete(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`);

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'nothing':
                let newIdentifier;
                if(!identifier){
                    newIdentifier = genRandString(15);
                    while(shopItems.filter(s => s.identifier === newIdentifier).length > 0){
                        newIdentifier = genRandString(15);
                    }
                    newIdentifier = newIdentifier.toLowerCase();
                } else {
                    newIdentifier = identifier;
                }
                try{
                    await client.dbHandler.setValue(`shop`, {...interactionInfo, identifier: newIdentifier}, {identifier: newIdentifier, guildId: interaction.guild.id});
                } catch {}

                client.interactionActions.delete(`new-shop-item-${interaction.member.id}-${interaction.guild.id}`);

                const itemAdded = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Item added`)
                .setDescription(`The item has successfully been added to the shop.`)
                .setTimestamp();

                interaction.update({embeds: [itemAdded], components: []}).catch(err => {});
                break;
            case 'role':
                const roleInput = new TextInputBuilder()
                .setCustomId('role')
                .setLabel('Role id or name')
                .setRequired(true)
                .setPlaceholder('No role provided')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1);

                const roleModal = new ModalBuilder()
                .setCustomId(`new-shop-item-role-reward${identifier ? `__${identifier}` : ``}`)
                .setTitle('Role reward')
                .setComponents(new ActionRowBuilder().addComponents(roleInput));

                interaction.showModal(roleModal).catch(err => {});
                break;
        }
    }
}
const { TextInputBuilder, ModalBuilder, ActionRowBuilder, TextInputStyle, StringSelectMenuBuilder, User, Team, EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'select-economy-settings-action',
        description: 'When a member provides the setting to change'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();
        
        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the economy settings has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'balance':
                const userInput = new TextInputBuilder()
                .setCustomId(`user`)
                .setMinLength(1)
                .setMaxLength(50)
                .setStyle(TextInputStyle.Short)
                .setLabel(`Username, user tag or user id`)
                .setRequired(true)
                .setPlaceholder(`No user provided`);
                const userModal = new ModalBuilder()
                .setCustomId(`user-select-economy`)
                .setTitle(`Search the user`)
                const userActionRow = new ActionRowBuilder().addComponents(userInput);
                userModal.addComponents(userActionRow);

                interaction.showModal(userModal);
                break;
            case 'vccoins':
                if(message.member.id !== client.application.ownerId){
                    if(client.application.owner instanceof User){
                        if(client.application.owner.id !== message.member.id){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else if(client.application.owner instanceof Team) {
                        if(!client.application.owner.members.get(message.member.id)){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else {
                        return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                    }
                }
                const vccoinsSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`vccoins-select-admin`)
                .setPlaceholder(`No action selected`)
                .setOptions([{
                    label: `${client.config.economy.voice.enabled === true ? `Disable` : `Enable`} voice channel coins`,
                    value: client.config.economy.voice.enabled === true ? `disable` : `enable`,
                    description: `${client.config.economy.voice.enabled === true ? `Disable` : `Enable`} that users get coins by talking in voice channels`
                }, {
                    label: 'Change coins amount',
                    value: 'amount',
                    description: `Change the amount of coins users get`
                }, {
                    label: 'Change time',
                    value: 'time',
                    description: `Change the time users have to talk before they get coins`
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);
                const vccoinsEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(`Select an action`)
                .setDescription(`Please select an action to execute`)
                .setTimestamp();

                const vccoinsActionRow = new ActionRowBuilder().addComponents(vccoinsSelectMenu);

                interaction.update({embeds: [vccoinsEmbed], components: [vccoinsActionRow]}).catch(err => {});
                break;
            case 'shop':
                const shopAction = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select what you\'d like to change`)
                .setDescription(`Please select an action in the select menu below to perform the action.`)
                .setTimestamp();

                const shopActionMenu = new StringSelectMenuBuilder()
                .setCustomId('select-shop-action')
                .setPlaceholder('No action selected')
                .setOptions([{
                    label: 'Add item',
                    value: 'add',
                    description: 'Add a new item which members can purchase'
                }, {
                    label: 'Remove item',
                    value: 'remove',
                    description: 'Remove an item from being purchased'
                }, {
                    label: 'Edit item',
                    value: 'edit',
                    description: 'Edit an existing item from the shop'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const shopActionRow = new ActionRowBuilder().addComponents(shopActionMenu);

                interaction.update({embeds: [shopAction], components: [shopActionRow]}).catch(err => {});
                break;
            case 'inventory':
                const userInputInventory = new TextInputBuilder()
                .setCustomId(`user`)
                .setMinLength(1)
                .setMaxLength(50)
                .setStyle(TextInputStyle.Short)
                .setLabel(`Username, user tag or user id`)
                .setRequired(true)
                .setPlaceholder(`No user provided`);
                const userModalInventory = new ModalBuilder()
                .setCustomId(`user-select-economy-inventory`)
                .setTitle(`Search the user`)
                const userActionRowInventory = new ActionRowBuilder().addComponents(userInputInventory);
                userModalInventory.addComponents(userActionRowInventory);

                interaction.showModal(userModalInventory);
                break;
        }
    }
}
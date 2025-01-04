const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const handle = require('../../../handlers/economy.js');
const messages = require('../../../messages.json');
const handleMessage = require('../../../handlers/handleMessages.js');
const { wait } = require("../../../functions.js");

module.exports = {
    data: {
        id: 'select-economy-inventory-action',
        description: 'When the member has provided the action they\'d like to perform for the member\'s inventory'
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

        const action = interaction.values[0].toLowerCase();

        if(action === "cancel"){
            const cancelled = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Action cancelled`)
            .setDescription(`The action to change <@!${inventoryMember.id}>'s inventory has been cancelled`)
            .setTimestamp();

            client.interactionActions.delete(`change-inventory-member-${interaction.member.id}-${interaction.guild.id}`);

            return interaction.update({embeds: [cancelled], components: []}).catch(err => {});
        }

        let shopItems = client.deepCopy(client.shop.get(interaction.guild.id) ?? []).sort((a, b) => {
            return a.price - b.price;
        });

        const userEconomy = handle.getUser(client, inventoryMember.id, interaction);
        const guildEconomy = userEconomy.filter(e => e.guild === interaction.guild.id)[0];
        
        const noItems = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`No items in shop`)
        .setDescription(`There are no items in the shop available. Therefore you cannot change the member's inventory.`)
        .setTimestamp();

        if(shopItems.length === 0 && guildEconomy.inventory.length === 0) return interaction.update({embeds: [noItems], components: []}).catch(err => {});

        function genShopItemsEmbed(msg, page, ended, list){
            shopItems = list;
            if(shopItems.length === 0) return;

            if(page > Math.ceil(shopItems.length / 10)) page = Math.ceil(shopItems.length / 10);
            else if(page < 1) page = 1;
            
            const shopEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Select one of the items below`)
            .setTimestamp();

            let pageItems = shopItems.slice((page - 1) * 10, page*10);

            let items = "";
            const itemOptions = [];
            for(const item of pageItems){
                let emoji = stock = "";
                if(typeof item.emoji === 'string'){
                    emoji = handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].shop.shop.emoji, [{EMOJI: item.emoji}]);
                }
                if(item.stock !== 'Infinity' && typeof item.stock === 'number'){
                    stock = handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].shop.shop.stock, [{STOCK: item.stock.toString()}]);
                }
                if(items.length > 0) items += "\n\n";
                items += handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].shop.shop.item, [{EMOJI: emoji, STOCK: stock, NAME: item.name, PRICE: `🪙 ${item.price ?? 'Unknown price'}`, DESCRIPTION: item.description ?? 'Unknown description'}]);
                itemOptions.push({
                    label: item.name,
                    value: item.identifier.toLowerCase()
                });
            }

            itemOptions.push({
                label: 'Cancel',
                value: 'cancel',
                description: 'Cancel this action'
            });

            shopEmbed.setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].shop.shop.message, [{ITEMS: items}]));

            const selectItem = new StringSelectMenuBuilder()
            .setCustomId(`select-item-change-inventory`)
            .setPlaceholder('No item selected')
            .setDisabled(ended)
            .setOptions(itemOptions);

            const selectItemActionRow = new ActionRowBuilder().addComponents(selectItem);

            const sendObj = {embeds: [shopEmbed], components: [selectItemActionRow], fetchReply: true};

            if(shopItems.length > 10){
                const previousPageBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setDisabled(ended === false ? page <= 1 : true)
                .setCustomId('previous-page-btn')
                .setLabel('◀️');
                const currentPageBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('current-page-btn')
                .setDisabled(true)
                .setLabel(`Page ${page}/${Math.ceil(shopItems.length / 10)}`);
                const nextPageBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setDisabled(ended === false ? page >= Math.ceil(shopItems.length / 10) : true)
                .setCustomId('next-page-btn')
                .setLabel(`▶️`);

                const btnActionRow = new ActionRowBuilder().addComponents(previousPageBtn, currentPageBtn, nextPageBtn);

                sendObj['components'].push(btnActionRow);
            }

            new Promise((resolve, reject) => {
                if(msg) interaction.editReply(client.handleContent(interaction, sendObj)).then(resolve).catch(reject);
                else interaction.update(sendObj).then(resolve).catch(reject);
            }).then(_msg => {
                if(ended === true) return;
                const collector = interaction.message.createMessageComponentCollector({
                    filter: i => i.member.id === interaction.member.id && ['select-item-change-inventory', 'previous-page-btn', 'next-page-btn'].indexOf(i.customId) >= 0,
                    max: 1,
                    time: 3*6e4
                });

                collector.on('collect', async i => {
                    i.deferUpdate().catch(err => {});
                    await wait(4e2);
                    if(i.customId === 'previous-page-btn'){
                        --page;
                        genShopItemsEmbed(true, page, false, list);
                    } else if(i.customId === 'next-page-btn') {
                        ++page;
                        genShopItemsEmbed(true, page, false, list);
                    } else if(i.customId === 'select-item-change-inventory'){
                        const itemIdentifier = i.values[0].toLowerCase();

                        if(itemIdentifier === "cancel"){
                            const cancelled = new EmbedBuilder()
                            .setColor(client.embedColor)
                            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                            .setTitle(`Action cancelled`)
                            .setDescription(`The action to change <@!${inventoryMember.id}>'s inventory has been cancelled`)
                            .setTimestamp();

                            client.interactionActions.delete(`change-inventory-member-${interaction.member.id}-${interaction.guild.id}`);

                            return interaction.editReply({embeds: [cancelled], components: []}).catch(err => {});
                        }

                        const shopItem = shopItems.filter(i => i.identifier === itemIdentifier)[0];

                        const itemNotFound = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(`Item not found`)
                        .setDescription(`The item you tried to ${action === "add" ? "add to" : "remove from"} <@!${inventoryMember.id}>'s inventory wasn't found.`)
                        .setTimestamp();

                        if(!shopItem) return interaction.editReply({embeds: [itemNotFound], components: []}).catch(err => {});


                        if(action === "add"){
                            guildEconomy.inventory.push({identifier: shopItem.identifier, name: shopItem.name});
                            if(typeof shopItem.role === 'string'){
                                inventoryMember.roles.add(shopItem.role).catch(err => {});
                                await wait(4e2);
                            }
                        } else if(action === "remove"){
                            let item = guildEconomy.inventory.filter(i => i.identifier === shopItem.identifier)[0];
                            if(!item) return interaction.editReply({embeds: [itemNotFound], components: []}).catch(err => {});
                            let itemIndex = guildEconomy.inventory.indexOf(item);
                            if(itemIndex >= 0) guildEconomy.inventory.splice(itemIndex, 1);
                            if(typeof shopItem.role === 'string'){
                                inventoryMember.roles.remove(shopItem.role).catch(err => {});
                                await wait(4e2);
                            }
                        }

                        try{
                            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: inventoryMember.id, guildId: interaction.guild.id});
                        } catch {}

                        const inventoryChanged = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(`Inventory changed`)
                        .setDescription(`<@!${inventoryMember.id}>'s inventory has successfully been changed.`)
                        .setTimestamp();

                        return interaction.editReply({embeds: [inventoryChanged], components: []}).catch(err => {});
                    }
                });

                collector.on('end', collected => {
                    if(collected.size === 0){
                        return _msg.delete().catch(err => {});
                    } else return;
                })
            }).catch(console.log);
        }

        switch(action){
            case 'add':
                if(shopItems.length === 0) return interaction.update({embeds: [noItems], components: []}).catch(err => {});

                const ownsAllItems = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cannot add items`)
                .setDescription(`The member already has all available items in the shop. Therefore no more items can be added to the member's inventory.`)
                .setTimestamp();

                if(shopItems.filter(i => guildEconomy.inventory.filter(_i => _i.identifier === i.identifier).length === 0).length === 0) return interaction.update({embeds: [ownsAllItems], components: []}).catch(err => {});

                let availableShopItems = shopItems.filter(i => guildEconomy.inventory.filter(_i => _i.identifier === i.identifier).length === 0).sort((a, b) => {
                    return a.price - b.price;
                });
                
                genShopItemsEmbed(undefined, 1, false, availableShopItems);
                break;
            case 'remove':
                const hasNoItems = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Member has no items`)
                .setDescription(`The member has no items in their inventory. Therefore no items can be removed from the member's inventory.`)
                .setTimestamp();

                if(guildEconomy.inventory.length === 0) return interaction.update({embeds: [hasNoItems], components: []}).catch(err => {});

                let removableShopItems = [];
                for(const item of guildEconomy.inventory){
                    const getShopItem = shopItems.filter(i => i.identifier === item.identifier)[0];
                    if(getShopItem) removableShopItems.push(getShopItem);
                    else removableShopItems.push(item);
                }

                removableShopItems.sort((a, b) => {
                    return (a?.price ?? 0) - (b?.price ?? 0);
                });

                genShopItemsEmbed(undefined, 1, false, removableShopItems);
                break;
        }
    }
}
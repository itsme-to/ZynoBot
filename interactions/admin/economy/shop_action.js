const { TextInputBuilder, ModalBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require("discord.js");
const messages = require('../../../messages.json');
const handleMessage = require('../../../handlers/handleMessages.js');
const { wait } = require("../../../functions.js");

module.exports = {
    data: {
        id: 'select-shop-action',
        description: 'When a member provides the action they\'d like to perform for the shop'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        let shopItems = client.deepCopy(client.shop.get(interaction.guild.id) ?? []).sort((a, b) => {
            return a.price - b.price;
        });

        function genShopItemsEmbed(msg, page, ended, id){
            shopItems = client.deepCopy(client.shop.get(interaction.guild.id) ?? []).sort((a, b) => {
                return a.price - b.price;
            });
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
                items += handleMessage(client, interaction.member.user, undefined, interaction.channel, messages["economy-cmds"].shop.shop.item, [{EMOJI: emoji, STOCK: stock, NAME: item.name, PRICE: `🪙 ${item.price}`, DESCRIPTION: item.description}]);
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
            .setCustomId(id)
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
                    filter: i => i.member.id === interaction.member.id && ['previous-page-btn', 'next-page-btn'].indexOf(i.customId) >= 0,
                    max: 1,
                    time: 3*6e4
                });

                collector.on('collect', async i => {
                    i.deferUpdate().catch(err => {});
                    await wait(4e2);
                    if(i.customId === 'previous-page-btn'){
                        --page;
                        genShopItemsEmbed(true, page, false, id);
                    } else {
                        ++page;
                        genShopItemsEmbed(true, page, false, id);
                    }
                });

                collector.on('end', collected => {
                    if(collected.size === 0){
                        return _msg.delete().catch(err => {});
                    } else return;
                })
            }).catch(err => {});
        }

        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the shop has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'add':
                const itemModal = new ModalBuilder()
                .setTitle('Create a new item')
                .setCustomId('create-new-shop-item');

                const nameInput = new TextInputBuilder()
                .setLabel('Product name')
                .setRequired(true)
                .setMaxLength(30)
                .setMinLength(1)
                .setCustomId('name')
                .setPlaceholder('No name provided (required)')
                .setStyle(TextInputStyle.Short);
                const priceInput = new TextInputBuilder()
                .setLabel('Product price')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(11)
                .setCustomId('price')
                .setPlaceholder('No price provided (required)')
                .setStyle(TextInputStyle.Short);
                const emojiInput = new TextInputBuilder()
                .setLabel('Emoji')
                .setRequired(false)
                .setMaxLength(30)
                .setCustomId('emoji')
                .setPlaceholder('No emoji provided (not required)')
                .setStyle(TextInputStyle.Short);
                const stockInput = new TextInputBuilder()
                .setLabel('Stock')
                .setRequired(false)
                .setMaxLength(11)
                .setCustomId('stock')
                .setPlaceholder('No stock provided (not required)')
                .setStyle(TextInputStyle.Short);
                const descriptionInput = new TextInputBuilder()
                .setLabel('Product description')
                .setRequired(true)
                .setMaxLength(200)
                .setMinLength(1)
                .setCustomId('description')
                .setPlaceholder('No description provided (required)')
                .setStyle(TextInputStyle.Paragraph);

                itemModal.addComponents(new ActionRowBuilder().setComponents(nameInput), new ActionRowBuilder().setComponents(priceInput), new ActionRowBuilder().setComponents(emojiInput), new ActionRowBuilder().setComponents(stockInput), new ActionRowBuilder().setComponents(descriptionInput));

                interaction.showModal(itemModal).catch(err => {});
                break;
            case 'remove':
                const noShopItemsRemove = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`No shop items`)
                .setDescription(`There are no items available in the shop and therefore no items can be removed.`)
                .setTimestamp();

                if(shopItems.length === 0) return interaction.update({embeds: [noShopItemsRemove], components: []});

                genShopItemsEmbed(undefined, 1, false, 'remove-shop-item');
                break;
            case 'edit':
                const noShopItemsUpdate = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`No shop items`)
                .setDescription(`There are no items available in the shop and therefore no items can be edited.`)
                .setTimestamp();

                if(shopItems.length === 0) return interaction.update({embeds: [noShopItemsUpdate], components: []});

                genShopItemsEmbed(undefined, 1, false, 'edit-shop-item');
                break;
        }
    }
}
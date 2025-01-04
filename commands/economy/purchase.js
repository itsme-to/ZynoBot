const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require("../../functions.js");

module.exports = {
    data: {
        name: 'purchase',
        description: 'Purchase an item from the economy shop',
        options: [],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        let shopItems = client.deepCopy(client.shop.get(message.guild.id) ?? []);

        const noItems = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["no-items"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["no-items"].message))
        .setTimestamp();

        if(shopItems.length === 0) return sendMessage({embeds: [noItems]}).catch(err => {});

        function genShopEmbed(msg, page, ended){
            shopItems = client.deepCopy(client.shop.get(message.guild.id) ?? []);
            if(shopItems.length === 0) return;

            if(page > Math.ceil(shopItems.length / 10)) page = Math.ceil(shopItems.length / 10);
            else if(page < 1) page = 1;
            
            const shopEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase.shop.title))
            .setTimestamp();

            let pageItems = shopItems.slice((page - 1) * 10, page*10);

            let items = "";
            const itemOptions = [];
            for(const item of pageItems){
                let emoji = stock = "";
                if(typeof item.emoji === 'string'){
                    emoji = handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase.shop.emoji, [{EMOJI: item.emoji}]);
                }
                if(item.stock !== 'Infinity' && typeof item.stock === 'number'){
                    stock = handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase.shop.stock, [{STOCK: item.stock.toString()}]);
                }
                if(items.length > 0) items += "\n\n";
                items += handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase.shop.item, [{EMOJI: emoji, STOCK: stock, NAME: item.name, PRICE: `🪙 ${item.price}`, DESCRIPTION: item.description}]);
                itemOptions.push({
                    label: item.name,
                    value: item.identifier.toLowerCase(),
                    description: `${handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase.shop.purchase)} ${item.name}`
                });
            }

            shopEmbed.setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase.shop.message, [{ITEMS: items}]));

            const purchaseMenu = new StringSelectMenuBuilder()
            .setCustomId('purchase-menu')
            .setPlaceholder('No item selected')
            .setOptions(itemOptions);

            const purchaseActionRow = new ActionRowBuilder().addComponents(purchaseMenu);

            const sendObj = {embeds: [shopEmbed], components: [purchaseActionRow]};

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
                if(msg) msg.edit(client.handleContent(message, sendObj)).then(resolve).catch(reject);
                else sendMessage(sendObj).then(resolve).catch(reject);
            }).then(_msg => {
                if(ended === true) return;
                const collector = _msg.createMessageComponentCollector({
                    filter: i => i.member.id === message.member.id && ['purchase-menu', 'previous-page-btn', 'next-page-btn'].indexOf(i.customId) >= 0,
                    max: 1,
                    time: 3*6e4
                });

                collector.on('collect', async i => {
                    i.deferUpdate().catch(err => {});
                    await wait(4e2);
                    if(i.customId === 'previous-page-btn'){
                        --page;
                        genShopEmbed(_msg, page, false);
                    } else if(i.customId === 'next-page-btn') {
                        ++page;
                        genShopEmbed(_msg, page, false);
                    } else if(i.customId === 'purchase-menu'){
                        const userEconomy = handle.getUser(client, message.member.id, message);
                        const guildEconomy = userEconomy.filter(e => e.guild === message.guild.id)[0];
                        
                        const itemVal = i.values[0].toLowerCase();

                        const itemNotFound = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["item-not-found"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["item-not-found"].message))
                        .setTimestamp();

                        const item = shopItems.filter(i => i.identifier.toLowerCase() === itemVal)[0];
                        if(!item) return _msg.edit(client.handleContent(message, {embeds: [itemNotFound], components: []})).catch(err => {});

                        const itemNotInStock = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["item-not-in-stock"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["item-not-in-stock"].message))
                        .setTimestamp();

                        if(item.stock === 0) return _msg.edit(client.handleContent(message, {embeds: [itemNotInStock], components: []})).catch(err => {});

                        const alreadyOwned = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["already-owned"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["already-owned"].message))
                        .setTimestamp();

                        if(guildEconomy.inventory.filter(e => e.identifier === item.identifier).length > 0) return _msg.edit(client.handleContent(message, {embeds: [alreadyOwned], components: []})).catch(err => {});

                        const notEnoughCash = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["not-enough-cash"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["not-enough-cash"].message))
                        .setTimestamp();

                        if(item.price > guildEconomy.cash) return _msg.edit(client.handleContent(message, {embeds: [notEnoughCash], components: []})).catch(err => {});

                        if(typeof item.stock === 'number'){
                            item.stock -= 1;
                            try{
                                await client.dbHandler.setValue(`shop`, item, {identifier: item.identifier, guildId: message.guild.id});
                            } catch {}
                        }

                        const purchased = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["purchased"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].purchase["purchased"].message))
                        .setTimestamp();

                        _msg.edit(client.handleContent(message, {embeds: [purchased], components: []})).catch(err => {});
                        await wait(4e2);

                        guildEconomy.cash -= item.price;
                        guildEconomy.inventory.push({identifier: item.identifier, name: item.name});
                        
                        if(['string', 'number'].indexOf(typeof item.role) >= 0){
                            message.member.roles.add(item.role.toString()).catch(err => {});
                        }

                        try{
                            await client.dbHandler.setValue(`economy`, guildEconomy, {memberId: message.member.id, guildId: message.guild.id});
                        } catch {}
                    }
                });

                collector.on('end', collected => {
                    if(collected.size === 0){
                        genShopEmbed(_msg, page, true);
                    } else return;
                })
            }).catch(err => {});
        }

        genShopEmbed(undefined, 1, false);
    }
}
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require("../../functions.js");

module.exports = {
    data: {
        name: 'shop',
        description: 'View the available items to purchase in the shop',
        options: [],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        let shopItems = client.deepCopy(client.shop.get(message.guild.id) ?? []).sort((a, b) => {
            return a.price - b.price;
        });

        const noItems = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].shop["no-items"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].shop["no-items"].message))
        .setTimestamp();

        if(shopItems.length === 0) return sendMessage({embeds: [noItems]}).catch(err => {});

        function genShopEmbed(msg, page, ended){
            shopItems = client.deepCopy(client.shop.get(message.guild.id) ?? []).sort((a, b) => {
                return a.price - b.price;
            });
            if(shopItems.length === 0) return;

            if(page > Math.ceil(shopItems.length / 10)) page = Math.ceil(shopItems.length / 10);
            else if(page < 1) page = 1;
            
            const shopEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].shop.shop.title))
            .setTimestamp();

            let pageItems = shopItems.slice((page - 1) * 10, page*10);

            let items = "";
            for(const item of pageItems){
                let emoji = stock = "";
                if(typeof item.emoji === 'string'){
                    emoji = handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].shop.shop.emoji, [{EMOJI: item.emoji}]);
                }
                if(item.stock !== 'Infinity' && typeof item.stock === 'number'){
                    stock = handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].shop.shop.stock, [{STOCK: item.stock.toString()}]);
                }
                if(items.length > 0) items += "\n\n";
                items += handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].shop.shop.item, [{EMOJI: emoji, STOCK: stock, NAME: item.name, PRICE: `🪙 ${item.price}`, DESCRIPTION: item.description}]);
            }

            shopEmbed.setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].shop.shop.message, [{ITEMS: items}]));

            const sendObj = {embeds: [shopEmbed]};

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

                sendObj['components'] = [btnActionRow];
            }

            new Promise((resolve, reject) => {
                if(msg) msg.edit(client.handleContent(message, sendObj)).then(resolve).catch(reject);
                else sendMessage(sendObj).then(resolve).catch(reject);
            }).then(_msg => {
                if(ended === true) return;
                const collector = _msg.createMessageComponentCollector({
                    filter: i => i.member.id === message.member.id && ['previous-page-btn', 'next-page-btn'].indexOf(i.customId) >= 0,
                    max: 1,
                    time: 3*6e4
                });

                collector.on('collect', async i => {
                    i.deferUpdate().catch(err => {});
                    await wait(4e2);
                    if(i.customId === 'previous-page-btn'){
                        --page;
                        genShopEmbed(_msg, page, false);
                    } else {
                        ++page;
                        genShopEmbed(_msg, page, false);
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
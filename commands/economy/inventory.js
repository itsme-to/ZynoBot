const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const handle = require('../../handlers/economy.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'inventory',
        description: 'Show your or someone else\'s inventory',
        options: [{type: 6, name: 'user', description: 'The user who\'s inventory you would like to view', required: false}],
        category: 'Economy',
        defaultEnabled: false,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        let member = message.member;
        if(interaction === false){
            if(message.mentions.members.size > 0) member = message.mentions.members.first();
        } else {
            let pM = message.options.getUser('user');
            if(pM){
                member = await client.cache.getMember(pM.id, message.guild);
                if(!member){
                    const noMemberFound = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].inventory["no-member-found"].title))
                    .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].inventory["no-member-found"].message))
                    .setTimestamp();

                    return sendMessage({embeds: [noMemberFound]}).catch(err => {});
                }
            }
        }
        
        const userEconomy = handle.getUser(client, member.id, message);
        const guildEconomy = userEconomy.filter(e => e.guild === message.guild.id)[0];

        const noInventory = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, member.user, message.member.user, message.channel, messages["economy-cmds"].inventory["no-inventory"].title))
        .setDescription(handleMessage(client, member.user, message.member.user, message.channel, messages["economy-cmds"].inventory["no-inventory"].message))
        .setTimestamp();

        if(guildEconomy.inventory.length === 0) return sendMessage({embeds: [noInventory]}).catch(err => {});

        let shopItems = client.deepCopy(client.shop.get(message.guild.id) ?? []).sort((a, b) => {
            return a.price - b.price;
        });;

        function genInventoryEmbed(msg, page, ended){
            if(page > Math.ceil(guildEconomy.inventory.length / 10)) page = Math.ceil(guildEconomy.inventory.length / 10);
            else if(page < 1) page = 1;
            
            const inventoryEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].inventory.inventory.title))
            .setTimestamp();

            let pageItems = shopItems.filter(i => guildEconomy.inventory.filter(_i => _i.identifier === i.identifier).length > 0).sort((a, b) => {
                return a.price - b.price;
            }).slice((page - 1) * 10, page*10);

            let items = "";
            for(const item of pageItems){
                // const item = shopItems.filter(i => i.identifier === itemInfo.identifier)[0];
                if(!item){
                    if(items.length > 0) items += "\n\n";
                    items += handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].inventory.inventory.item, [{EMOJI: '', NAME: itemInfo.name, PRICE: `🪙 Unknown`}])
                } else {
                    let emoji = "";
                    if(typeof item.emoji === 'string'){
                        emoji = handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].inventory.inventory.emoji, [{EMOJI: item.emoji}]);
                    }
                    if(items.length > 0) items += "\n\n";
                    items += handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].inventory.inventory.item, [{EMOJI: emoji, NAME: item.name, PRICE: `🪙 ${item.price}`}]);
                }
            }

            inventoryEmbed.setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages["economy-cmds"].inventory.inventory.message, [{ITEMS: items}]));

            const sendObj = {embeds: [inventoryEmbed]};

            if(guildEconomy.inventory.length > 10){
                const previousPageBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setDisabled(ended === false ? page <= 1 : true)
                .setCustomId('previous-page-btn')
                .setLabel('◀️');
                const currentPageBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('current-page-btn')
                .setDisabled(true)
                .setLabel(`Page ${page}/${Math.ceil(guildEconomy.inventory.length / 10)}`);
                const nextPageBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setDisabled(ended === false ? page >= Math.ceil(guildEconomy.inventory.length / 10) : true)
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

                collector.on('collect', i => {
                    if(i.customId === 'previous-page-btn'){
                        --page;
                        genInventoryEmbed(_msg, page, false);
                    } else {
                        ++page;
                        genInventoryEmbed(_msg, page, false);
                    }
                });

                collector.on('end', collected => {
                    if(collected.size === 0){
                        genInventoryEmbed(_msg, page, true);
                    } else return;
                })
            }).catch(err => {});
        }

        genInventoryEmbed(undefined, 1, false);
    }
}
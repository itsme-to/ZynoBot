const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const handleMessage = require("../../handlers/handleMessages.js");
const messages = require("../../messages.json");
const { wait } = require("../../functions.js");

module.exports = {
    data: {
        name: 'mytickets',
        description: 'See the tickets you have claimed or have been assigned to',
        options: [],
        category: 'Tickets',
        defaultEnabled: false,
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const myTickets = client.tickets.filter(t => Array.isArray(t.value) ? t.value.filter(_t => _t.guild === message.guild.id && _t.claimed === message.member.id).length > 0 : false);

        let assignedTickets = [];
        let page = 0;

        async function changePage(msg, ended = false){
            const myTicketEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands["success-messages"]["my-tickets"].title))
            .setTimestamp();

            let ticketText = ``;
            let pageTickets = assignedTickets.slice(page * 10, (page + 1) * 10);

            for(var i = 0; i < pageTickets.length; i++){
                let ticket = pageTickets[i];
                if(i === 0) ticketText += `**[${i + 1 + (page * 10)}]** <#${ticket.channel}>`;
                else ticketText += `\n**[${i + 1 + (page * 10)}]** <#${ticket.channel}>`;
            }

            let maxPage = Math.ceil(assignedTickets.length / 10);

            myTicketEmbed.setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands["success-messages"]["my-tickets"].message, [{TICKETS: ticketText}]));

            const pageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
            .setCustomId('page-button-my-tickets')
            .setLabel('Page '+(page + 1)+'/'+maxPage);
            
            const previousPageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId(`previous-page`)
            .setLabel(`◀️`);
            if(page <= 0){
                previousPageButton.setDisabled(true);
            }
            const nextPageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId(`next-page`)
            .setLabel(`▶️`);
            if(maxPage <= (page + 1)){
                nextPageButton.setDisabled(true);   
            }
            if(ended === true){
                previousPageButton.setDisabled(true);
                nextPageButton.setDisabled(true);
            }

            const pageActionRow = new ActionRowBuilder().addComponents(previousPageButton, pageButton, nextPageButton);
            
            let payload = {embeds: [myTicketEmbed], components: [pageActionRow]};

            new Promise((resolve, reject) => {
                if(msg === null){
                    sendMessage(payload).then(resolve).catch(reject);
                } else {
                    msg.edit(payload).then(resolve).catch(reject);
                }
            }).then(_msg => {
                if(ended === false){
                    const collector = _msg.createMessageComponentCollector({
                        filter: i => i.user.id === message.member.id && ['previous-page', 'next-page'].indexOf(i.customId) >= 0,
                        max: 1,
                        time: 3*6e4
                    });

                    collector.on('collect', async i => {
                        i.deferUpdate().catch(err => {});
                        await wait(4e2);
                        if(i.customId === 'next-page'){
                            ++page;
                        } else if(i.customId === 'previous-page'){
                            --page;
                        }
                        changePage(_msg, false);
                    });

                    collector.on('end', collected => {
                        if(collected.size === 0) return changePage(_msg, true);
                    });
                }
            }).catch(err => {})
        }

        if(myTickets.size === 0){
            const myTicketEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands["success-messages"]["my-tickets"].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.tickets.commands["success-messages"]["my-tickets"]["no-tickets"]))
            .setTimestamp();

            return sendMessage({embeds: [myTicketEmbed]}).catch(err => {});
        } else {
            const readableArr = myTickets.toReadableArray();
            for(var i = 0; i < readableArr.length; i++){
                let userTickets = readableArr[i];
                assignedTickets.push(...userTickets.value.filter(t => t.guild === message.guild.id && t.claimed === message.member.id));
            }

            changePage(null, false);
        }
    }
}
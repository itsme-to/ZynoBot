const { EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions.js');

module.exports = {
    data: {
        name: 'poll overview',
        description: 'Get an overview of all the active polls',
        options: [],
        category: 'Polls',
        defaultEnabled: false,
        permissions: 'ManageMessages',
        visible: true,
        subCommand: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get((args[0]+' '+args[1]).toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.overview["no-permissions"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.overview["no-permissions"].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const activePolls = client.polls.toReadableArray().map(p => p.value);

        const noActive = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.overview["no-polls"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.overview["no-polls"].message))
        .setTimestamp();

        if(activePolls.length === 0) return sendMessage({embeds: [noActive]}).catch(err => {});

        function switchPage(page = 1, _msg, edit, ended = false){
            let pollInfo = activePolls[page - 1];

            const pageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
            .setCustomId('page-button-my-tickets')
            .setLabel('Page '+page+'/'+activePolls.length);
            
            const previousPageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId(`previous-page`)
            .setLabel(`◀️`);
            const nextPageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId(`next-page`)
            .setLabel(`▶️`);
            if(page <= 1 || ended === true){
                previousPageButton.setDisabled(true);
            }
            if(page >= activePolls.length || ended === true){
                nextPageButton.setDisabled(true);
            }

            const pageActionRow = new ActionRowBuilder().addComponents(previousPageButton, pageButton, nextPageButton);

            let choices = pollInfo.choices.map((c, i) => {
                const votes = pollInfo.voters.filter(v => v.vote === (i + 1));
                return handleMessage(client, message.member.user, undefined, message.channel, messages.polls.overview.overview.options[(i + 1).toString()], [{OPTION: c, VOTES: votes.length.toString(), TOTAL_VOTES: pollInfo.voters.length.toString(), PERCENTAGE: `${Math.round(votes.length / pollInfo.voters.length * 100)}%`}]);
            });

            const overviewEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.overview.overview.title, [{QUESTION: pollInfo.question}]))
            .setURL(`https://discord.com/channels/${pollInfo.guild}/${pollInfo.channel}/${pollInfo.message}`)
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.overview.overview.message, [{OPTIONS: choices.join('\n'), CHANNEL_MENTION: `<#${pollInfo.channel}>`, CREATED_TIMESTAMP: `<t:${Math.round(pollInfo.startTimestamp / 1000)}>`, END_TIMESTAMP: `<t:${Math.round(pollInfo.endTimestamp / 1000)}>`, QUESTION: pollInfo.question, TOTAL_VOTES: pollInfo.voters.length.toString()}]))
            .setFields(messages.polls.overview.overview.fields.reduce((arr, item) => {
                let newField = {
                    name: handleMessage(client, message.member.user, undefined, message.channel, item.name, [{OPTIONS: choices.join('\n'), CHANNEL_MENTION: `<#${pollInfo.channel}>`, CREATED_TIMESTAMP: `<t:${Math.round(pollInfo.startTimestamp / 1000)}>`, END_TIMESTAMP: `<t:${Math.round(pollInfo.endTimestamp / 1000)}>`, QUESTION: pollInfo.question, TOTAL_VOTES: pollInfo.voters.length.toString()}]),
                    value: handleMessage(client, message.member.user, undefined, message.channel, item.message, [{OPTIONS: choices.join('\n'), CHANNEL_MENTION: `<#${pollInfo.channel}>`, CREATED_TIMESTAMP: `<t:${Math.round(pollInfo.startTimestamp / 1000)}>`, END_TIMESTAMP: `<t:${Math.round(pollInfo.endTimestamp / 1000)}>`, QUESTION: pollInfo.question, TOTAL_VOTES: pollInfo.voters.length.toString()}]),
                    inline: true
                };
                arr.push(newField);
                return arr;
            }, []))
            .setTimestamp();

            new Promise((resolve, reject) => {
                if(edit === false) sendMessage({embeds: [overviewEmbed], components: [pageActionRow]}).then(resolve).catch(reject);
                else _msg.edit(client.handleContent(message, {embeds: [overviewEmbed], components: [pageActionRow]})).then(resolve).catch(reject);
            }).then(msg => {
                if(ended === false){
                    const collector = msg.createMessageComponentCollector({
                        filter: i => i.user.id === message.member.id && ['previous-page', 'next-page'].indexOf(i.customId) >= 0,
                        max: 1,
                        time: 3*6e4
                    });

                    collector.on('collect', async i => {
                        i.deferUpdate().catch(err => {});
                        await wait(400);

                        switch(i.customId){
                            case 'previous-page':
                                --page;
                                break;
                            case 'next-page':
                                ++page;
                                break;
                        }
                        switchPage(page, msg, true, false);
                    });

                    collector.on('end', collected => {
                        if(collected.size === 0) return switchPage(page, msg, true, true);
                    });
                }
            }).catch(err => {});
        }

        switchPage(1, message, false);
    }
}
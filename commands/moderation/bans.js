const { EmbedBuilder, PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions');

module.exports = {
    data: {
        name: 'bans',
        description: 'See all the bans in a server',
        category: 'Moderation',
        options: [],
        defaultEnabled: false,
        permissions: 'BanMembers',
        visible: true
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);
        
        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.bans['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.bans['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noBans = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.bans['error-messages']['no-bans'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.bans['error-messages']['no-bans'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();
        
        if(message.guild.bans.cache.size === 0) return sendMessage({embeds: [noBans]}).catch(err => {});

        let page = 1;

        function showUsersButtons(disable){
            const previousPageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId('previous-bans-page')
            .setLabel('◀️')
            if(page === 1 || disable === true) previousPageButton.setDisabled(true);
            const nextPageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId('next-bans-page')
            .setLabel('▶️');
            if(page * 10 >= message.guild.bans.cache.size || disable === true) nextPageButton.setDisabled(true);
            const pageButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('bans-current-page')
            .setLabel(`Page ${page}/${Math.ceil(message.guild.bans.cache.size / 10)}`)
            .setDisabled(true);

            return new ActionRowBuilder().addComponents(previousPageButton, pageButton, nextPageButton);
        }

        function usersEmbed(){
            const usersEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.bans['bans-list'].title))

            let selectBans = message.guild.bans.cache.map(b => b).slice((page - 1) * 10, page * 10);
            selectBans = selectBans.reduce((str, ban, i) => {
                let banString = handleMessage(client, message.member.user, ban.user, message.channel, messages.moderation.bans['bans-list']['list-item'], [{COUNT: (page - 1) * 10 + i + 1, USER_ID: ban.user.id, REASON: ban.reason || 'No reason added'}]);
                if(i === 0) str += `\n${banString}`;
                else str += `\n\n${banString}`;
                return str;
            }, handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.bans['bans-list'].message));

            usersEmbed.setDescription(selectBans)
            .setTimestamp();

            return usersEmbed;
        }

        let embed = usersEmbed();
        let components = showUsersButtons(false);

        function createFilter(msg){
            const filter = i => ['next-bans-page', 'previous-bans-page'].indexOf(i.customId) >= 0 && i.user.id === message.member.id;
            const collector = msg.createMessageComponentCollector({filter: filter, time: 2*6e4, max: 1});

            collector.on('collect', async (i) => {
                i.deferUpdate().catch(err => {});
                await wait(400);
                if(i.customId === 'next-bans-page'){
                    ++page;
                    embed = usersEmbed();
                    components = showUsersButtons(false);

                    msg.edit(client.handleContent(message, {embeds: [embed], components: [components]})).then(() => {
                        createFilter(msg);
                    }).catch(err => {});
                } else if(i.customId === 'previous-bans-page'){
                    --page;
                    embed = usersEmbed();
                    components = showUsersButtons(false);

                    msg.edit(client.handleContent(message, {embeds: [embed], components: [components]})).then(() => {
                        createFilter(msg);
                    }).catch(err => {});
                }
            });

            collector.on('end', collected => {
                if(collected.size === 0){
                    embed = usersEmbed();
                    components = showUsersButtons(true);

                    msg.edit(client.handleContent(message, {embeds: [embed], components: [components]})).catch(err => {});
                }
            });
        }

        sendMessage({embeds: [embed], components: [components]}).then(msg => {
            createFilter(msg);
        }).catch(err => {});
    }
}
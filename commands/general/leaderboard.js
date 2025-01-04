const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { getXPForLevel } = require("../../functions");

module.exports = {
    data: {
        name: 'leaderboard',
        description: 'See the leaderboard',
        options: [{type: 3, name: 'type', description: 'Which leaderboard you want to see', choices: [{
            name: 'Level',
            value: 'level'
        }, {
            name: 'Messages',
            value: 'messages'
        }, {
            name: 'Economy',
            value: 'economy'
        }, {
            name: 'Invites',
            value: 'invites'
        }], required: true}],
        category: 'General',
        defaultEnabled: true,
        visible: true
    },
    run: async function(client, uargs, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);
        var replyMessage = null;

        async function sendLeaderboard(args, msg){
            if(args[1].toLowerCase() === 'level'){
                var users = client.xp.toReadableArray().filter(x => x.value.filter(_x => _x.guild === message.guild.id).length > 0).map(x => {
                    return {
                        key: x.key,
                        value: x.value.filter(f => f.guild === message.guild.id)[0]
                    };
                });
                var levels = [...users];
                levels.sort((a, b) => {
                    if(typeof b.value.xp !== 'number'){
                        b.value.xp = getXPForLevel(b.value.level, message.guild.id);
                    }
                    if(typeof a.value.xp !== 'number'){
                        a.value.xp = getXPForLevel(a.value.level, message.guild.id);
                    }
                    return b.value.xp - a.value.xp;
                });
                levels = levels.slice(0, 10);

                var leaderboard = levels.length > 0 ? '' : handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard["no-users"]);

                for(var i = 0; i < levels.length; i++){
                    var user = levels[i];
                    try{
                        const guildMember = await client.cache.getMember(user.key, message.guild);
                        if(!guildMember){
                            if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **Unknown member**: ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['level-text'])} ${user.value.level.toLocaleString('fullwide', {useGrouping: false})} (${user.value.xp.toLocaleString('fullwide', {useGrouping: false})} XP)`;
                            else leaderboard += `\n**[${i + 1}]** **Unknown member**: ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['level-text'])} ${user.value.level.toLocaleString('fullwide', {useGrouping: false})} (${user.value.xp.toLocaleString('fullwide', {useGrouping: false})} XP)`;
                        } else {
                            if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **${guildMember.user.username}**: ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['level-text'])} ${user.value.level.toLocaleString('fullwide', {useGrouping: false})} (${user.value.xp.toLocaleString('fullwide', {useGrouping: false})} XP)`;
                            else leaderboard += `\n**[${i + 1}]** **${guildMember.user.username}**: ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['level-text'])} ${user.value.level.toLocaleString('fullwide', {useGrouping: false})} (${user.value.xp.toLocaleString('fullwide', {useGrouping: false})} XP)`;
                        }
                    } catch(err) {
                        if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **Unknown member**: ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['level-text'])} ${user.value.level.toLocaleString('fullwide', {useGrouping: false})} (${user.value.xp.toLocaleString('fullwide', {useGrouping: false})} XP)`;
                        else leaderboard += `\n**[${i + 1}]** **Unknown member**: ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['level-text'])} ${user.value.level.toLocaleString('fullwide', {useGrouping: false})} (${user.value.xp.toLocaleString('fullwide', {useGrouping: false})} XP)`;
                    }
                }

                const leaderboardEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaderboard-title']))
                .setDescription(leaderboard)
                .setTimestamp();

                if(!msg) sendMessage({embeds: [leaderboardEmbed], components: []}).catch(err => {});
                else replyMessage({embeds: [leaderboardEmbed], components: []}).catch(err => {});
            } else if(args[1].toLowerCase() === 'economy'){
                var users = client.economy.toReadableArray().filter(e => e.value.filter(_e => _e.guild === message.guild.id).length > 0).map(e => {
                    return {
                        key: e.key,
                        value: e.value.filter(f => f.guild === message.guild.id)[0]
                    };
                });
                var economy = [...users];
                economy.sort((a, b) => {
                    return (b.value.bank + b.value.cash) - (a.value.bank + a.value.cash);
                });
                economy = economy.slice(0, 10);

                var leaderboard = economy.length > 0 ? '' : handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard["no-users"]);

                for(var i = 0; i < economy.length; i++){
                    var user = economy[i];
                    try{
                        const guildMember = await client.cache.getMember(user.key, message.guild);
                        if(!guildMember){
                            if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **Unknown member**: 🪙 ${(user.value.cash + user.value.bank).toLocaleString('fullwide', {useGrouping: false})}`;
                            else leaderboard += `\n**[${i + 1}]** **Unknown member**: 🪙 ${(user.value.cash + user.value.bank).toLocaleString('fullwide', {useGrouping: false})}`;
                        } else {
                            if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **${guildMember.user.username}**: 🪙 ${(user.value.cash + user.value.bank).toLocaleString('fullwide', {useGrouping: false})}`;
                            else leaderboard += `\n**[${i + 1}]** **${guildMember.user.username}**: 🪙 ${(user.value.cash + user.value.bank).toLocaleString('fullwide', {useGrouping: false})}`;
                        }
                    } catch(err) {
                        if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **Unknown member**: 🪙 ${(user.value.cash + user.value.bank).toLocaleString('fullwide', {useGrouping: false})}`;
                        else leaderboard += `\n**[${i + 1}]** **Unknown member**: 🪙 ${(user.value.cash + user.value.bank).toLocaleString('fullwide', {useGrouping: false})}`;
                    }
                }

                const leaderboardEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaderboard-title']))
                .setDescription(leaderboard)
                .setTimestamp();

                if(!msg) sendMessage({embeds: [leaderboardEmbed], components: []}).catch(err => {});
                else replyMessage({embeds: [leaderboardEmbed], components: []}).catch(err => {});
            } else if(args[1].toLowerCase() === 'messages'){
                var users = client.xp.toReadableArray().filter(x => x.value.filter(_x => _x.guild === message.guild.id).length > 0).map(x => {
                    return {
                        key: x.key,
                        value: x.value.filter(f => f.guild === message.guild.id)[0]
                    };
                });
                var messagesLeaderboard = [...users];
                messagesLeaderboard.sort((a, b) => {
                    return b.value.messages - a.value.messages;
                });
                messagesLeaderboard = messagesLeaderboard.slice(0, 10);

                var leaderboard = messagesLeaderboard.length > 0 ? '' : handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard["no-users"]);

                for(var i = 0; i < messagesLeaderboard.length; i++){
                    var user = messagesLeaderboard[i];
                    try{
                        const guildMember = await client.cache.getMember(user.key, message.guild);
                        if(!guildMember){
                            if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **Unknown member**: ${user.value.messages.toLocaleString('fullwide', {useGrouping: false})} ${user.value.messages !== 1 ? handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['messages-text']) : handleMessage(client, message.member.user, undefined, message.channel, messages.level['message-text'])}`;
                            else leaderboard += `\n**[${i + 1}]** **Unknown member**: ${user.value.messages.toLocaleString('fullwide', {useGrouping: false})} ${user.value.messages !== 1 ? handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['messages-text']) : handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['message-text'])}`;
                        } else {
                            if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **${guildMember.user.username}**: ${user.value.messages.toLocaleString('fullwide', {useGrouping: false})} ${user.value.messages !== 1 ? handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['messages-text']) : handleMessage(client, message.member.user, undefined, message.channel, messages.level['message-text'])}`;
                            else leaderboard += `\n**[${i + 1}]** **${guildMember.user.username}**: ${user.value.messages.toLocaleString('fullwide', {useGrouping: false})} ${user.value.messages !== 1 ? handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['messages-text']) : handleMessage(client, message.member.user, undefined, message.channel, messages.level['message-text'])}`;
                        }
                    } catch(err) {
                        if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **Unknown member**: ${user.value.messages.toLocaleString('fullwide', {useGrouping: false})} ${user.value.messages !== 1 ? handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['messages-text']) : handleMessage(client, message.member.user, undefined, message.channel, messages.level['message-text'])}`;
                        else leaderboard += `\n**[${i + 1}]** **Unknown member**: ${user.value.messages.toLocaleString('fullwide', {useGrouping: false})} ${user.value.messages !== 1 ? handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['messages-text']) : handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['message-text'])}`;
                    }
                }

                const leaderboardEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaderboard-title']))
                .setDescription(leaderboard)
                .setTimestamp();

                if(!msg) sendMessage({embeds: [leaderboardEmbed], components: []}).catch(err => {});
                else replyMessage({embeds: [leaderboardEmbed], components: []}).catch(err => {});
            } else if(args[1].toLowerCase() === 'invites'){
                var users = client.userinfo.toReadableArray().filter(x => x.value.filter(_x => _x.guild === message.guild.id && typeof _x.invites === 'number' && typeof _x.inviteleaves === 'number').length > 0).map(x => {
                    return {
                        key: x.key,
                        value: x.value.filter(f => f.guild === message.guild.id)[0]
                    };
                });
                var invitesLeaderboard = [...users];
                invitesLeaderboard.sort((a, b) => {
                    return (b.value.invites - b.value.inviteleaves) - (a.value.invites - a.value.inviteleaves);
                });
                invitesLeaderboard = invitesLeaderboard.slice(0, 10);

                var leaderboard = invitesLeaderboard.length > 0 ? '' : handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard["no-users"]);

                for(var i = 0; i < invitesLeaderboard.length; i++){
                    var user = invitesLeaderboard[i];
                    try{
                        const guildMember = await client.cache.getMember(user.key, message.guild);
                        if(!guildMember){
                            if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **Unknown member**: ${user.value.invites.toLocaleString('fullwide', {useGrouping: false})} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['invite-text'])} | ${user.value.inviteleaves} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaves-text'])} | ${(user.value.invites - user.value.inviteleaves)} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['total-invites-text'])}`;
                            else leaderboard += `\n**[${i + 1}]** **Unknown member**: ${user.value.invites.toLocaleString('fullwide', {useGrouping: false})} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['invite-text'])} | ${user.value.inviteleaves} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaves-text'])} | ${(user.value.invites - user.value.inviteleaves)} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['total-invites-text'])}`;
                        } else {
                            if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **${guildMember.user.username}**: ${user.value.invites.toLocaleString('fullwide', {useGrouping: false})} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['invite-text'])} | ${user.value.inviteleaves} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaves-text'])} | ${(user.value.invites - user.value.inviteleaves)} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['total-invites-text'])}`;
                            else leaderboard += `\n**[${i + 1}]** **${guildMember.user.username}**: ${user.value.invites.toLocaleString('fullwide', {useGrouping: false})} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['invite-text'])} | ${user.value.inviteleaves} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaves-text'])} | ${(user.value.invites - user.value.inviteleaves)} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['total-invites-text'])}`;
                        }
                    } catch(err) {
                        if(leaderboard.length === 0) leaderboard += `**[${i + 1}]** **Unknown member**: ${user.value.invites.toLocaleString('fullwide', {useGrouping: false})} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['invite-text'])} | ${user.value.inviteleaves} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaves-text'])} | ${(user.value.invites - user.value.inviteleaves)} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['total-invites-text'])}`;
                        else leaderboard += `\n**[${i + 1}]** **Unknown member**: ${user.value.invites.toLocaleString('fullwide', {useGrouping: false})} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['invite-text'])} | ${user.value.inviteleaves} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaves-text'])} | ${(user.value.invites - user.value.inviteleaves)} ${handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['total-invites-text'])}`;
                    }
                }

                const leaderboardEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard['leaderboard-title']))
                .setDescription(leaderboard)
                .setTimestamp();

                if(!msg) sendMessage({embeds: [leaderboardEmbed], components: []}).catch(err => {});
                else replyMessage({embeds: [leaderboardEmbed], components: []}).catch(err => {});
            }
        }

        function sendSelect(){
            const row = new ActionRowBuilder().addComponents([
                new StringSelectMenuBuilder()
                .setCustomId('select-leaderboard-type')
                .setPlaceholder('No option selected')
                .setOptions([{
                    label: 'Level',
                    value: 'level'
                }, {
                    label: 'Messages',
                    value: 'messages'
                }, {
                    label: 'Economy',
                    value: 'economy'
                }, {
                    label: 'Invites',
                    value: 'invites'
                }])
            ]);
            const selectEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard["select-leaderboard-type"].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.leaderboard["select-leaderboard-type"].message))
            .setTimestamp();
            sendMessage({embeds: [selectEmbed], components: [row]}).then(msg => {
                replyMessage = client.replyMessage(message, interaction, msg);
                client.interactionInfo.get(`ignore`).set(msg.id, true);
                const filter = i => (i.customId === 'select-leaderboard-type') && i.user.id === message.member.id;
                const collector = msg.createMessageComponentCollector({filter, time: 2*60*1000});
                collector.on('collect', i => {
                    const val = i.values[0];
                    i.deferUpdate().catch(err => {});
                    collector.stop();
                    sendLeaderboard(['leaderboard', val], msg)
                });
            }).catch(err => {});
        }

        if(!uargs[1]){
            sendSelect();
        } else if(['level', 'messages', 'economy', 'invites'].indexOf(uargs[1].toLowerCase()) >= 0){
            sendLeaderboard(['leaderboard', uargs[1].toLowerCase()], null);
        } else {
            sendSelect();
        }
    }
}
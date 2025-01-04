const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, TextInputBuilder, TextInputStyle, ModalBuilder } = require("discord.js");
const handleMessage = require("../handlers/handleMessages.js");
const messages = require("../messages.json");
const { wait } = require("../functions");

module.exports = {
    data: {
        id: 'downvote-suggestion',
        description: 'When a suggestion gets downvoted',
        permissions: 'ManageMessages'
    },
    run: async function(client, interaction){
        const { data } = client.interactions.get(interaction.customId.split('__')[0]);
        let suggestionInfo = client.suggestions.get(interaction.message.id);
        if(!suggestionInfo) return interaction.deferUpdate().catch(err => {});
        suggestionInfo = client.deepCopy(suggestionInfo);

        var remove = false;

        let creator = await client.cache.getUser(suggestionInfo.userId);
        if(!creator) creator = {username: 'Unknown', displayName: 'Unknown', id: '0', displayAvatarURL: () => {return 'https://cdn.discordapp.com/embed/avatars/0.png';}};

        const findUser = suggestionInfo.voters.filter(v => v.id === interaction.member.user.id);
        if(suggestionInfo.voters.length >= 400 && findUser.length === 0) return interaction.deferUpdate().catch(err => {});
        else if(findUser.length > 0){
            const voterInfo = suggestionInfo.voters[suggestionInfo.voters.indexOf(findUser[0])];
            if(voterInfo.voted === 'down'){
                suggestionInfo.downvotes -= 1;
                suggestionInfo.voters.splice(suggestionInfo.voters.indexOf(findUser[0]), 1);
                remove = true;
            } else {
                suggestionInfo.upvotes -= 1;
                suggestionInfo.voters.splice(suggestionInfo.voters.indexOf(findUser[0]), 1);
                suggestionInfo.downvotes += 1;
                suggestionInfo.voters.push({
                    id: interaction.member.user.id,
                    voted: 'down'
                });
            }
        } else {
            suggestionInfo.downvotes += 1;
            suggestionInfo.voters.push({
                id: interaction.member.user.id,
                voted: 'down'
            });
        }

        const suggestion = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, creator, undefined, interaction.channel, messages.general.suggest.embed.title, [{SUGGESTION: suggestionInfo.suggestion}]))
        .setDescription(handleMessage(client, creator, undefined, interaction.channel, messages.general.suggest.embed.message, [{SUGGESTION: suggestionInfo.suggestion}]))
        .setFields(messages.general.suggest.embed.fields.reduce((arr, item) => {
            arr.push({
                inline: item.inline,
                name: handleMessage(client, creator, undefined, interaction.channel, item.name, [{UPVOTES: suggestionInfo.upvotes, DOWNVOTES: suggestionInfo.downvotes, STATUS: handleMessage(client, creator, undefined, interaction.channel, messages.general.suggest.embed.status["awaiting-approval"])}]),
                value: handleMessage(client, creator, undefined, interaction.channel, item.value, [{UPVOTES: suggestionInfo.upvotes, DOWNVOTES: suggestionInfo.downvotes, STATUS: handleMessage(client, creator, undefined, interaction.channel, messages.general.suggest.embed.status["awaiting-approval"])}])
            });
            return arr;
        }, []))
        .setThumbnail(creator.displayAvatarURL({extension: 'png', size: 256}))
        .setTimestamp();

        const upvoteBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`upvote-suggestion`)
        .setLabel(`👍 ${suggestionInfo.upvotes}`);
        const downvoteBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`downvote-suggestion`)
        .setLabel(`👎 ${suggestionInfo.downvotes}`);

        const votesActionRow = new ActionRowBuilder().addComponents(upvoteBtn, downvoteBtn);

        interaction.message.edit({embeds: [suggestion], components: [votesActionRow]}).catch(err => {});

        try{
            await client.dbHandler.setValue(`suggestions`, suggestionInfo, {messageId: interaction.message.id, guildId: interaction.guild.id});
        } catch {}
        
        await wait(400);

        if(interaction.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && interaction.member.roles.cache.filter(r => client.config.moderator_roles[interaction.guild.id].indexOf(r.id) >= 0).size > 0 && remove === false){
            const denyAction = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.general.suggest.actions.deny.title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.general.suggest.actions.deny.message))
            .setTimestamp();

            const confirmBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setLabel(`Yes`)
            .setCustomId(`confirm-deny`);
            const cancelBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setLabel(`No`)
            .setCustomId(`cancel-deny`);

            const actionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

            interaction.reply({embeds: [denyAction], components: [actionRow], ephemeral: true, fetchReply: true}).then(async msg => {
                const filter = i => i.user.id === interaction.member.user.id && ['confirm-deny', 'cancel-deny'].includes(i.customId);
                const collector = msg.createMessageComponentCollector({filter: filter, time: 2*60*1000, max: 1});

                collector.on('collect', async i => {
                    if(i.customId === 'confirm-deny'){
                        client.interactionActions.set(`suggestion-${interaction.member.id}-${interaction.guild.id}`, {approve: false, messageId: interaction.message.id, userId: suggestionInfo.userId, suggestion: suggestionInfo.suggestion, upvotes: suggestionInfo.upvotes, downvotes: suggestionInfo.downvotes});
                        
                        const reasonInput = new TextInputBuilder()
                        .setCustomId('reason')
                        .setPlaceholder('No reason provided')
                        .setLabel('Do you want to provide a reason?')
                        .setMinLength(1)
                        .setMaxLength(100)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);

                        const reasonActionRow = new ActionRowBuilder().addComponents(reasonInput);

                        const formBuilder = new ModalBuilder()
                        .setTitle('Reason')
                        .setCustomId('suggestion-reason')
                        .setComponents(reasonActionRow);

                        i.showModal(formBuilder).catch(err => {});
                    } else {
                        const cancelledEmbed = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, creator, interaction.member.user, interaction.channel, messages.general.suggest.actions.cancel.title))
                        .setDescription(handleMessage(client, creator, interaction.member.user, interaction.channel, messages.general.suggest.actions.cancel.message))
                        .setTimestamp();

                        i.update({embeds: [cancelledEmbed], components: []}).catch(console.log);
                    }
                });

                collector.on('end', collected => {
                    client.interactionInfo.get(`ignore`).delete(msg.id);
                    if(collected.size === 0) return msg.delete().catch(err => {});
                });
            }).catch(err => {});
        } else {
            var action = remove === true ? messages.general.suggest.confirmation.actions.removed : messages.general.suggest.confirmation.actions.added;

            const confirm = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.general.suggest.confirmation.downvote.title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.general.suggest.confirmation.downvote.message, [{ACTION: action}]))
            .setTimestamp();
            
            interaction.reply({embeds: [confirm], ephemeral: true}).catch(err => {});
        }
    }
}
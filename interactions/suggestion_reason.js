const { EmbedBuilder } = require("discord.js");
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');
const { wait } = require("../functions.js");

module.exports = {
    data: {
        id: 'suggestion-reason',
        description: 'Gets executed when a member provides a reason to approve or deny a suggestion'
    },
    run: async function(client, interaction){
        const interactionInfo = client.interactionActions.get(`suggestion-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteracation = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.general.suggest["unknown-interaction"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.general.suggest["unknown-interaction"].message))
        .setTimestamp();

        if(!interactionInfo) return interaction.update({embeds: [unknownInteracation], components: []}).catch(err => {});

        var suggestionUser = await client.cache.getUser(interactionInfo.userId);
        if(!suggestionUser) suggestionUser = {tag: 'Unknown user', username: 'Unknown user', id: 'Unknown user', displayAvatarURL: () => {return 'https://cdn.discordapp.com/embed/avatars/0.png';}};

        let reason = interaction.fields.getTextInputValue('reason');
        if((reason ?? '').length === 0) reason = handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.general.suggest.actions.success["no-reason"]);

        const successApprovedEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, suggestionUser, interaction.member.user, interaction.channel, messages.general.suggest.actions.success.approved.title))
        .setDescription(handleMessage(client, suggestionUser, interaction.member.user, interaction.channel, messages.general.suggest.actions.success.approved.message))
        .setTimestamp();

        const approvedEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, suggestionUser, interaction.member.user, interaction.channel, messages.general.suggest.actions.approved.title, [{SUGGESTION: interactionInfo.suggestion, REASON: reason}]))
        .setDescription(handleMessage(client, suggestionUser, interaction.member.user, interaction.channel, messages.general.suggest.actions.approved.message, [{SUGGESTION: interactionInfo.suggestion, REASON: reason}]))
        .setFields(messages.general.suggest.embed.fields.reduce((arr, item) => {
            arr.push({
                inline: item.inline,
                name: handleMessage(client, suggestionUser, undefined, interaction.channel, item.name, [{UPVOTES: interactionInfo.upvotes, DOWNVOTES: interactionInfo.downvotes, STATUS: handleMessage(client, suggestionUser, undefined, interaction.channel, messages.general.suggest.embed.status.approved)}]),
                value: handleMessage(client, suggestionUser, undefined, interaction.channel, item.value, [{UPVOTES: interactionInfo.upvotes, DOWNVOTES: interactionInfo.downvotes, STATUS: handleMessage(client, suggestionUser, undefined, interaction.channel, messages.general.suggest.embed.status.approved)}])
            });
            return arr;
        }, []))
        .setThumbnail(suggestionUser.displayAvatarURL({extension: 'png', size: 256}))
        .setTimestamp();

        const successDeniedEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, suggestionUser, interaction.member.user, interaction.channel, messages.general.suggest.actions.success.denied.title))
        .setDescription(handleMessage(client, suggestionUser, interaction.member.user, interaction.channel, messages.general.suggest.actions.success.denied.message))
        .setTimestamp();

        const deniedEmbed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, suggestionUser, interaction.member.user, interaction.channel, messages.general.suggest.actions.denied.title, [{SUGGESTION: interactionInfo.suggestion, REASON: reason}]))
        .setDescription(handleMessage(client, suggestionUser, interaction.member.user, interaction.channel, messages.general.suggest.actions.denied.message, [{SUGGESTION: interactionInfo.suggestion, REASON: reason}]))
        .setFields(messages.general.suggest.embed.fields.reduce((arr, item) => {
            arr.push({
                inline: item.inline,
                name: handleMessage(client, suggestionUser, undefined, interaction.channel, item.name, [{UPVOTES: interactionInfo.upvotes, DOWNVOTES: interactionInfo.downvotes, STATUS: handleMessage(client, suggestionUser, undefined, interaction.channel, messages.general.suggest.embed.status.rejected)}]),
                value: handleMessage(client, suggestionUser, undefined, interaction.channel, item.value, [{UPVOTES: interactionInfo.upvotes, DOWNVOTES: interactionInfo.downvotes, STATUS: handleMessage(client, suggestionUser, undefined, interaction.channel, messages.general.suggest.embed.status.rejected)}])
            });
            return arr;
        }, []))
        .setThumbnail(suggestionUser.displayAvatarURL({extension: 'png', size: 256}))
        .setTimestamp();

        let suggestionMsg = interaction.channel.messages.cache.get(interactionInfo.messageId);
        if(!suggestionMsg){
            try{
                suggestionMsg = await interaction.channel.fetch(interactionInfo.messageId);
            } catch {}
        }

        if(!suggestionMsg) return interaction.update({embeds: [unknownInteracation], components: []}).catch(err => {});

        if(interactionInfo.approve === true){
            suggestionMsg.edit({embeds: [approvedEmbed], components: []}).catch(err => {});

            await wait(400);

            interaction.update({embeds: [successApprovedEmbed], components: []}).catch(err => {});
        } else {
            suggestionMsg.edit({embeds: [deniedEmbed], components: []}).catch(err => {});

            await wait(400);

            interaction.update({embeds: [successDeniedEmbed], components: []}).catch(err => {});
        }

        client.interactionActions.delete(`suggestion-${interaction.member.id}-${interaction.guild.id}`);

        try{
            await client.dbHandler.deleteValue(`suggestions`, {}, {messageId: interactionInfo.messageId, guildId: interaction.guild.id});
        } catch {}
    }
}
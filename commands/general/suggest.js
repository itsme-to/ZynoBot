const { EmbedBuilder, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, ThreadAutoArchiveDuration } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");
const { wait } = require("../../functions.js");

module.exports = {
    data: {
        name: 'suggest',
        description: 'Leave a suggestion in the suggestion channel',
        options: [{type: 3, name: 'suggestion', description: 'The suggestion you want to leave', required: true}],
        category: 'General',
        defaultEnabled: true,
        visible: true
    },
    run: async function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const suggestionDisabled = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.commandDisabled.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.commandDisabled.message))
        .setTimestamp();

        if(!(client.suggestionChannel[message.guild.id] instanceof TextChannel)){
            if(interaction === true) return message.reply(client.handleContent(message, {embeds: [suggestionDisabled], ephemeral: true})).catch(err => {});
            else return sendMessage({embeds: [suggestionDisabled]}).catch(err => {});
        }

        const noSuggestion = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest["no-suggestion-provided"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest["no-suggestion-provided"].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noSuggestion]}).catch(err => {});

        const suggestionTooLong = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest["suggestion-too-long"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest["suggestion-too-long"].message))
        .setTimestamp();

        if(args.slice(1).join(" ").length > 400) return sendMessage({embeds: [suggestionTooLong]}).catch(err => {});

        if(interaction){
            message.deferReply().catch(err => {});
            await wait(400);
        }

        const suggestion = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.title, [{SUGGESTION: args.slice(1).join(" ")}]))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.message, [{SUGGESTION: args.slice(1).join(" ")}]))
        .setFields(messages.general.suggest.embed.fields.reduce((arr, item) => {
            arr.push({
                inline: item.inline,
                name: handleMessage(client, message.member.user, undefined, message.channel, item.name, [{UPVOTES: (0).toString(), DOWNVOTES: (0).toString(), STATUS: handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.status["awaiting-approval"])}]),
                value: handleMessage(client, message.member.user, undefined, message.channel, item.value, [{UPVOTES: (0).toString(), DOWNVOTES: (0).toString(), STATUS: handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.status["awaiting-approval"])}])
            });
            return arr;
        }, []))
        .setThumbnail(message.member.user.displayAvatarURL({extension: 'png', size: 256}))
        .setTimestamp();

        const upvoteBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`upvote-suggestion`)
        .setLabel(`👍 0`);
        const downvoteBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`downvote-suggestion`)
        .setLabel(`👎 0`);

        const voteActionRow = new ActionRowBuilder().addComponents(upvoteBtn, downvoteBtn);

        const suggestionSent = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest["suggestion-sent"].title, [{SUGGESTION_CHANNEL: `<#${client.suggestionChannel[message.guild.id].id}>`}]))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest["suggestion-sent"].message, [{SUGGESTION_CHANNEL: `<#${client.suggestionChannel[message.guild.id].id}>`}]))
        .setTimestamp();

        client.suggestionChannel[message.guild.id].send(client.handleContent(message, {embeds: [suggestion], components: [voteActionRow]})).then(async msg => {
            try{
                await client.dbHandler.setValue(`suggestions`, {suggestion: args.slice(1).join(" "), userId: message.member.user.id, created: new Date().getTime(), upvotes: 0, downvotes: 0, voters: [], guild: message.guild.id}, {messageId: msg.id, guildId: message.guild.id});
            } catch {}
            await wait(4e2);

            if(!interaction) sendMessage({embeds: [suggestionSent]}).catch(err => {});
            else message.editReply({embeds: [suggestionSent]}).catch(err => {});

            if(client.config.suggestion[message.guild.id].autoThread){
                await wait(4e2);
                msg.startThread({
                    name: handleMessage(client, message.member.user, undefined, message.channel, messages.general.suggest.embed.title, [{SUGGESTION: args.slice(1).join(" ")}]).slice(0, 100),
                    reason: 'New suggestion',
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
                }).catch(console.log);
            }
        }).catch(err => {});
    }
}
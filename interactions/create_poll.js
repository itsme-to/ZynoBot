const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');

module.exports = {
    data: {
        id: 'poll-choice-options',
        description: 'When a new poll gets created and the choices have been provided'
    },
    run: function(client, interaction){
        const interactionInfo = client.interactionActions.get('polls-start-'+interaction.member.id+'-'+interaction.guild.id);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.polls.start["unknown-interaction"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.polls.start["unknown-interaction"].message))
        .setTimestamp();

        if(!interactionInfo) return interaction.update(client.handleContent(interaction, {embeds: [unknownInteraction], components: []})).catch(err => {});

        let choices = "";

        const choicesActionRow = new ActionRowBuilder();
        const optionEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

        for(let i = 1; i <= interactionInfo.choicesRaw; i++){
            const choiceInput = interaction.fields.getTextInputValue('choice-'+i);
            interactionInfo.choices.push(choiceInput);
            if(i > 1) choices += "\n";
            choices += handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.polls.start.embed.options[i.toString()], [{OPTION: choiceInput}]);
            const buttonOption = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('poll-choice-button__'+i)
            .setEmoji(optionEmojis[i - 1])
            .setLabel('0');
            choicesActionRow.addComponents(buttonOption);
        }

        const pollEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.polls.start.embed.title, [{QUESTION: interactionInfo.question}]))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.polls.start.embed.message, [{OPTIONS: choices, TIMESTAMP: `<t:${interactionInfo.clientEndTimestamp}>`, QUESTION: interactionInfo.question}]))
        .setTimestamp();

        client.interactionActions.delete('polls-start-'+interaction.member.id+'-'+interaction.guild.id);

        interaction.update({embeds: [pollEmbed], components: [choicesActionRow], fetchReply: true}).then(async msg => {

            try{
                await client.dbHandler.setValue(`polls`, {message: msg.id, channel: msg.channel.id, guild: msg.guild.id, ...interactionInfo}, {messageId: msg.id, channelId: interaction.channel.id, guildId: interaction.guild.id});
            } catch {}

            await client.pollHandler.reload(client);
        }).catch(console.log);
    }
}
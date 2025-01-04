const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');
const { wait } = require('../functions');

module.exports = {
    data: {
        id: 'poll-choice-button',
        description: 'When a member chooses one of the choices in a poll'
    },
    run: async function(client, interaction){
        interaction.deferUpdate().catch(err => {});
        
        await wait(400);

        const pollInfo = client.polls.get(interaction.message.id);
        if(!pollInfo) return;

        const pollOption = Number(interaction.customId.split('__')[1]);
        if(!pollOption) return;

        if(pollInfo.choicesRaw < pollOption) return;

        const vote = pollInfo.voters.filter(v => v.id === interaction.member.id);
        if(vote.length === 0 && pollInfo.voters.length >= 400) return;
        else if(vote.length > 0){
            const voteIndex = pollInfo.voters.indexOf(vote[0]);
            pollInfo.voters.splice(voteIndex, 1);
        }

        pollInfo.voters.push({
            id: interaction.member.id,
            vote: pollOption
        });

        let choices = "";

        const choicesActionRow = new ActionRowBuilder();
        const optionEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

        for(let i = 0; i < pollInfo.choicesRaw; i++){
            const choiceInput = pollInfo.choices[i];
            if(i > 0) choices += "\n";
            choices += handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.polls.start.embed.options[(i + 1).toString()], [{OPTION: choiceInput}]);
            const buttonOption = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setCustomId('poll-choice-button__'+(i + 1))
            .setEmoji(optionEmojis[i])
            .setLabel(pollInfo.voters.filter(v => v.vote === (i + 1)).length.toString());
            choicesActionRow.addComponents(buttonOption);
        }

        const pollEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.polls.start.embed.title, [{OPTIONS: choices, TIMESTAMP: `<t:${pollInfo.clientEndTimestamp}>`, QUESTION: pollInfo.question}]))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.polls.start.embed.message, [{OPTIONS: choices, TIMESTAMP: `<t:${pollInfo.clientEndTimestamp}>`, QUESTION: pollInfo.question}]))
        .setTimestamp();

        client.interactionActions.delete('polls-start-'+interaction.member.id+'-'+interaction.guild.id);

        interaction.message.edit({embeds: [pollEmbed], components: [choicesActionRow], fetchReply: true}).catch(console.log);

        try{
            await client.dbHandler.setValue(`polls`, pollInfo, {messageId: pollInfo.message, channelId: interaction.channel.id, guildId: interaction.guild.id});
        } catch {}
    }
}
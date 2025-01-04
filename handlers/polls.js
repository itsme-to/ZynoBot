const { EmbedBuilder } = require('discord.js');
const messages = require('../messages.json');
const handleMessage = require('./handleMessages.js');
const { wait } = require('../functions');

let timeout = null;

async function endPoll(client, poll){
    try{
        await client.dbHandler.deleteValue(`polls`, {}, {messageId: poll.message, guildId: poll.guild, channelId: poll.channel});
    } catch {}

    if(!client.mainguilds[poll.guild]) return;

    let winner = {
        votes: 0,
        winner: 1
    };

    const optionEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];

    const votesInfo = [];

    for(let i = 0; i < poll.choicesRaw; i++){
        let votes = poll.voters.filter(v => v.vote === (i + 1)).length;
        if(votes > winner.votes){
            winner.votes = votes;
            winner.winner = (i + 1);
        }
        votesInfo.push({
            option: (i + 1),
            votes: votes
        });
    }

    votesInfo.sort((a, b) => {
        return b.votes - a.votes
    });

    let ch;
    try{
        ch = await client.cache.getChannel(poll.channel, client.mainguilds[poll.guild]);
    } catch {
        return;
    }
    if(!ch) return;

    await wait(400);

    let msg;
    try{
        msg = await ch.messages.fetch(poll.message);
    } catch {
        return;
    }

    await wait(400);

    let choices = votesInfo.map((v) => {
        return handleMessage(client, client.user, undefined, ch, messages.polls['ended-embed'].options[v.option.toString()], [{OPTION: poll.choices[v.option - 1], RESULT: `${poll.voters.length > 0 ? Math.round(v.votes / poll.voters.length * 100) : `0`}%`}]);
    });

    const pollEmbed = new EmbedBuilder()
    .setColor(client.embedColor)
    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
    .setTitle(handleMessage(client, client.user, undefined, ch, messages.polls['ended-embed'].title))
    .setDescription(handleMessage(client, client.user, undefined, ch, messages.polls['ended-embed'].message, [{OPTIONS: choices.join('\n'), TIMESTAMP: `<t:${poll.clientEndTimestamp}>`, QUESTION: poll.question, RESULT: `${optionEmojis[winner.winner - 1]} ${poll.choices[winner.winner - 1]}`}]))
    .setTimestamp();

    msg.edit({embeds: [pollEmbed], components: []}).catch(err => {});

    await checkEnded(client);
}

async function checkEnded(client){
    if(timeout !== null){
        clearTimeout(timeout);
    }

    let nextEnd = 2*60*6e4;

    const cuTimestamp = new Date().getTime();
    const polls = client.polls.toReadableArray().map(p => p.value);

    for(var i = 0; i < polls.length; i++){
        await wait(400);
        let poll = polls[i];
        if(poll.endTimestamp <= cuTimestamp){
            await endPoll(client, poll);
        } else if((poll.endTimestamp - cuTimestamp) < nextEnd) {
            nextEnd = (poll.endTimestamp - cuTimestamp);
        }
    }

    setTimeout(function(client){
        checkEnded(client);
    }, nextEnd, client);
}

module.exports = {
    reload: async function(client){
        await checkEnded(client)
    },
    endPoll: async function(client, poll){
        await endPoll(client, poll);
    }
}
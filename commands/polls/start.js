const { EmbedBuilder, PermissionsBitField, StringSelectMenuBuilder, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require("discord.js");
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { getResolvableDate } = require('../../functions.js');

function firstUpperCase(string){
    var firstLetter = string.slice(0, 1);
    var newString = firstLetter.toUpperCase() + string.slice(1, string.length);
    return newString;
}

module.exports = {
    data: {
        name: 'poll start',
        description: 'Start a poll',
        options: [{type: 3, name: 'question', description: 'The question of the poll', required: true}, {type: 3, name: 'duration', description: 'The duration of the poll', required: true}],
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start["no-permissions"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start["no-permissions"].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const missingArguments = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start['missing-arguments'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start['missing-arguments'].message, [{PREFIX: client.config.prefix}]))
        .setTimestamp();

        if(args.length < 4) return sendMessage({embeds: [missingArguments]}).catch(err => {});

        var _args = [...args];
        _args.splice(0, 2);

        const invalidLength = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start['invalid-time'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start['invalid-time'].message))
        .setTimestamp();

        const length = _args.filter(a => /^[0-9]+[a-zA-Z]*$/.test(a));
        if(length.length === 0) return sendMessage({embeds: [invalidLength]}).catch(err => {});
        let pollLength = length[length.length - 1];
        let pollLengthIndex = _args.lastIndexOf(pollLength);
        if(/^[0-9]*$/.test(pollLength)){
            if(pollLengthIndex >= 0){
                pollLength = `${pollLength} ${_args[pollLengthIndex + 1]}`;
                _args.splice(pollLengthIndex, 2);
            } else {
                pollLength = `${pollLength} hours`;
                _args.splice(pollLengthIndex, 1);
            }
        } else {
            _args.splice(pollLengthIndex, 1);
        }

        pollLength = getResolvableDate(pollLength);
        if(pollLength < 6e4 || pollLength > 14*24*36e5) return sendMessage({embeds: [invalidLength]}).catch(err => {});

        const question = _args.join(' ');

        const invalidQuestion = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start['invalid-question'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start['invalid-question'].message))
        .setTimestamp();

        if(question.length < 1 || question.length > 100) return sendMessage({embeds: [invalidQuestion]}).catch(err => {});

        const timestamp = new Date().getTime();
        const endTimestamp = timestamp + pollLength;
        const clientEndTimestamp = Math.round((endTimestamp / 1000));

        const setChoices = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start['set-choices'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.polls.start['set-choices'].message))
        .setTimestamp();

        const choicesOptions = new StringSelectMenuBuilder()
        .setCustomId('set-poll-choices')
        .setPlaceholder('No amount of choices selected')
        .setOptions([{
            emoji: '2️⃣',
            label: '2 choices',
            value: '2'
        }, {
            emoji: '3️⃣',
            label: '3 choices',
            value: '3'
        }, {
            emoji: '4️⃣',
            label: '4 choices',
            value: '4'
        }, {
            emoji: '5️⃣',
            label: '5 choices',
            value: '5'
        }]);

        const choicesActionRow = new ActionRowBuilder().addComponents(choicesOptions);

        sendMessage({embeds: [setChoices], components: [choicesActionRow]}).then(async msg => {
            const collector = msg.createMessageComponentCollector({
                filter: i => i.user.id === message.member.id && i.isStringSelectMenu() && Number(i.values[0]) !== NaN,
                max: 1,
                time: 3*6e4
            });

            collector.on('collect', i => {
                const choices = parseInt(i.values[0]);
                client.interactionActions.set('polls-start-'+message.member.id+'-'+message.guild.id, {question: question, endTimestamp: endTimestamp, clientEndTimestamp: clientEndTimestamp, startTimestamp: timestamp, choicesRaw: choices, choices: [], voters: []});

                const choicesModal = new ModalBuilder()
                .setTitle('Choices')
                .setCustomId('poll-choice-options');

                for(let i = 1; i <= choices; i++){
                    const textInput = new TextInputBuilder()
                    .setStyle(TextInputStyle.Short)
                    .setCustomId('choice-'+i)
                    .setPlaceholder('No choice provided')
                    .setRequired(true)
                    .setLabel('Choice '+i)
                    .setMinLength(1)
                    .setMaxLength(50);

                    const textInputActionRow = new ActionRowBuilder().addComponents(textInput);

                    choicesModal.addComponents(textInputActionRow);
                }

                i.showModal(choicesModal).catch(err => {});
            });

            collector.on('end', collected => {
                if(collected.size === 0) return msg.delete().catch(err => {});
            });
        }).catch(err => {});
    }
}
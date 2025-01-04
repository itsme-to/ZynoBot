const { EmbedBuilder, PermissionsBitField, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
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
        name: 'giveaway start',
        description: 'Start a giveaway',
        options: [{type: 3, name: 'prize', description: 'The prize to give', required: true}, {type: 3, name: 'duration', description: 'The duration of the giveaway', required: true}, {type: 10, name: 'winners', description: 'The amount of winners', required: true}, {type: 3, name: 'requirements', description: 'Whether you\'d like to set requirements for the giveaway or not', choices: [{name: 'Yes', value: 'yes'}, {name: 'No', value: 'no'}], required: true}],
        category: 'Giveaway',
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
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start["no-permissions"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start["no-permissions"].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const missingArguments = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['missing-arguments'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['missing-arguments'].message, [{PREFIX: client.config.prefix}]))
        .setTimestamp();

        if(args.length < 5) return sendMessage({embeds: [missingArguments]}).catch(err => {});

        var _args = [...args];
        _args.splice(0, 2);

        const invalidWinners = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['invalid-winners'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['invalid-winners'].message))
        .setTimestamp();

        let requirements = /^[yes|requirements|requirement|no]*$/.test(_args[_args.length - 1].toLowerCase());
        if(requirements){
            requirements = _args[_args.length - 1].toLowerCase() !== "no";
            _args.splice((_args.length - 1), 1);
        }

        const winners = Number(_args[_args.length - 1]);
        if(!winners) return sendMessage({embeds: [invalidWinners]}).catch(err => {});
        else if(winners > 10 || winners < 1) return sendMessage({embeds: [invalidWinners]}).catch(err => {});

        _args.splice((_args.length - 1), 1);

        const invalidLength = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['invalid-time'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['invalid-time'].message))
        .setTimestamp();

        const length = _args.filter(a => /^[0-9]+[a-zA-Z]*$/.test(a));
        if(length.length === 0) return sendMessage({embeds: [invalidLength]}).catch(err => {});
        let giveawayLength = length[length.length - 1];
        let giveawayLengthIndex = _args.lastIndexOf(giveawayLength);
        if(/^[0-9]*$/.test(giveawayLength)){
            if(giveawayLengthIndex >= 0){
                giveawayLength = `${giveawayLength} ${_args[giveawayLengthIndex + 1]}`;
                _args.splice(giveawayLengthIndex, 2);
            } else {
                giveawayLength = `${giveawayLength} hours`;
                _args.splice(giveawayLengthIndex, 1);
            }
        } else {
            _args.splice(giveawayLengthIndex, 1);
        }

        giveawayLength = getResolvableDate(giveawayLength);
        if(giveawayLength < 6e4 || giveawayLength > 14*24*36e5) return sendMessage({embeds: [invalidLength]}).catch(err => {});

        const priceName = _args.join(' ');

        const invalidName = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['invalid-price'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['invalid-price'].message))
        .setTimestamp();

        if(priceName.length < 1 || priceName.length > 100) return sendMessage({embeds: [invalidName]}).catch(err => {});

        const timestamp = new Date().getTime();
        const endTimestamp = timestamp + giveawayLength;
        const clientEndTimestamp = Math.round((endTimestamp / 1000));

        if(!requirements){
            const giveawayEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: priceName, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['embed'].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['embed'].message, [{PRIZE: priceName, WINNERS: winners, TIMESTAMP: `<t:${clientEndTimestamp}>`, REQUIREMENTS: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed["no-requirements"])}]))
            .setTimestamp(endTimestamp);

            sendMessage({embeds: [giveawayEmbed]}).then(async msg => {
                msg.react(`🥳`).catch(err => {});
                try{
                    await client.dbHandler.setValue(`giveaways`, {messageId: msg.id, endTimestamp: endTimestamp, winners: winners, length: giveawayLength, channelId: msg.channel.id, priceName: priceName, clientEndTimestamp: clientEndTimestamp, ended: false, organizor: message.member.user.id, requirements: {invites: 0, messages: 0, level: 0}}, {messageId: msg.id});
                } catch(err) {
                    console.log(err);
                }
                client.giveawayHandler.handle(msg.id);
            }).catch(err => {});
        } else {
            const selectRequirements = new StringSelectMenuBuilder()
            .setCustomId('select-requirements-type')
            .setMaxValues(4)
            .setMinValues(1)
            .setOptions([{
                label: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements.options.invites.name),
                value: 'invites',
                description: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements.options.invites.description)
            }, {
                label: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements.options.level.name),
                value: 'level',
                description: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements.options.level.description)
            }, {
                label: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements.options.messages.name),
                value: 'messages',
                description: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements.options.messages.description)
            }, {
                label: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements.options.role.name),
                value: 'role',
                description: handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements.options.role.description)
            }]);
            const cancelBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setCustomId('cancel-select-requirements')
            .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start.embed.requirements["cancel-button"]));
            const menuActionRow = new ActionRowBuilder()
            .setComponents(selectRequirements);
            const cancelActionRow = new ActionRowBuilder()
            .setComponents(cancelBtn);

            const selectRequirementsEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: priceName, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['embed'].requirements["choose-requirement"].title))
            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.giveaway.start['embed'].requirements["choose-requirement"].message))
            .setTimestamp(endTimestamp);

            try{
                let reqMsg = await sendMessage({embeds: [selectRequirementsEmbed], components: [menuActionRow, cancelActionRow]});
                const reqCollector = reqMsg.createMessageComponentCollector({
                    filter: i => i.user.id === message.member.id && ['cancel-select-requirements', 'select-requirements-type'].indexOf(i.customId) >= 0,
                    time: 3*6e4,
                    max: 1
                });

                reqCollector.on('collect', i => {
                    if(i.customId === 'cancel-select-requirements' && i.isButton()){
                        return reqMsg.delete().catch(err => {});
                    } else if(i.customId === 'select-requirements-type' && i.isStringSelectMenu()){
                        const requirementTypes = [...i.values.map(v => v.toLowerCase())];
                        const requirementForm = new ModalBuilder()
                        .setCustomId('requirements-values-giveaway')
                        .setTitle('Requirements')
                        .setComponents(...requirementTypes.map(r => {
                            const textInput = new TextInputBuilder()
                            .setStyle(TextInputStyle.Short)
                            .setCustomId(r)
                            .setMaxLength(r === 'role' ? 100 : 3)
                            .setMinLength(1)
                            .setPlaceholder('No requirement provided')
                            .setRequired(true);

                            switch(r){
                                case 'invites':
                                    textInput.setLabel('Required amount of invites');
                                    break;
                                case 'level':
                                    textInput.setLabel('Required level');
                                    break;
                                case 'messages':
                                    textInput.setLabel('Required amount of messages');
                                    break;
                                case 'role':
                                    textInput.setLabel('Role name or id');
                                    break;
                            }

                            const textInputActionRow = new ActionRowBuilder().setComponents(textInput);

                            return textInputActionRow;
                        }));

                        i.showModal(requirementForm).catch(err => {});

                        client.interactionActions.set('giveaway-start-'+message.member.id+'-'+message.guild.id, {endTimestamp: endTimestamp, winners: winners, length: giveawayLength, channelId: message.channel.id, priceName: priceName, clientEndTimestamp: clientEndTimestamp, ended: false, organizor: message.member.user.id, requirementTypes: requirementTypes});
                    }
                });

                reqCollector.on('end', c => {
                    if(c.size === 0) return reqMsg.delete().catch(err => {});
                });
            } catch(err) {
                console.log(err);
            }
        }
    }
}
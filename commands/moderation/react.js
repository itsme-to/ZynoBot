const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, GuildEmoji, ButtonStyle, TextInputBuilder, TextInputStyle, ModalBuilder } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");
const { wait, validateEmote, validateDiscordEmote } = require("../../functions.js");

module.exports = {
    data: {
        name: 'react',
        description: 'Create or edit a react role message',
        options: [{type: 3, name: 'action', description: 'The action that needs to perform', choices: [{
            name: 'create',
            value: 'create'
        }, {
            name: 'delete',
            value: 'delete'
        }],
        required: true}],
        category: 'Moderation',
        invisible: false,
        defaultEnabled: false,
        permissions: 'ManageRoles'
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        var sendMessage = client.sendMessage(message, interaction);

        function createCollector(){
            return new Promise((resolve) => {
                let send = false;
                const filter = m => m.author.id === message.member.id;
                const collector = message.channel.createMessageCollector({filter: filter, time: 1000*60*3, max: 1});
                collector.on('collect', m => {
                    send = true;
                    resolve(m);
                    collector.stop();
                });
                collector.on('end', () => {
                    if(send === false) resolve(undefined);
                });
            });
        }

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react['error-messages']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react['error-messages']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions]) && message.member.roles.cache.filter(r => client.config.moderator_roles[message.guild.id].indexOf(r.id) >= 0).size === 0) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const invalidAction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react['error-messages']["invalid-action"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react['error-messages']["invalid-action"].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [invalidAction]}).catch(err => {});

        const actions = ['create', 'delete'];
        if(!actions.includes(args[1].toLowerCase())) return sendMessage({embeds: [invalidAction]}).catch(err => {});

        const unknownErr = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react['error-messages'].error.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react['error-messages'].error.message))
        .setTimestamp();

        const abortedTime = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["aborted-time"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["aborted-time"].message, [{ACTION: args[1].toLowerCase()}]))
        .setTimestamp();

        const invalidReply = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["invalid-reply"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["invalid-reply"].message))
        .setTimestamp();

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.cancel.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.cancel.message, [{ACTION: args[1].toLowerCase()}]))
        .setTimestamp();

        const channelNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["channel-not-found"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["channel-not-found"].message))
        .setTimestamp();
        const messageNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["message-not-found"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["message-not-found"].message))
        .setTimestamp();
        const invalidEmote = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["invalid-emoji"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["invalid-emoji"].message))
        .setTimestamp();
        const roleNotFound = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["role-not-found"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["role-not-found"].message))
        .setTimestamp();

        const reactionType = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-type"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-type"].message, [{BUTTON_TEXT: messages.moderation.react.actions.text.button, EMOJI_TEXT: messages.moderation.react.actions.text.emoji, SELECT_MENU_TEXT: messages.moderation.react.actions.text.selectmenu, CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
        .setTimestamp();

        const selectRole = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-role"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-role"].message, [{CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
        .setTimestamp();

        const messageIdEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.delete["provide-message-id"].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.delete["provide-message-id"].message, [{CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
        .setTimestamp();

        let idRegEx = /^[0-9]*$/;

        switch(args[1].toLowerCase()){
            case 'create':
                const selectAction = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["existing-message"].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["existing-message"].message, [{NEW_TEXT: messages.moderation.react.actions.text.new, CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
                .setTimestamp();

                try {
                    await sendMessage({embeds: [selectAction]});
                    interaction = false;
                    sendMessage = client.sendMessage(message, interaction);
                } catch {
                    await wait(500);
                    return sendMessage({embeds: [unknownErr]}).catch(err => {});
                }

                const createActionCollector = await createCollector();

                if(typeof createActionCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                const createAction = createActionCollector.content.toLowerCase().split(" ");
                var channel = reactmessage = null;
                var messageIndex = 1;
                if(createActionCollector.mentions.channels.first()){
                    channel = createActionCollector.mentions.channels.first();
                    const i = createAction.indexOf(channel.toString());
                    if(i === 1) messageIndex = 0;
                    const messageId = createAction.filter(id => idRegEx.test(id));
                    if(messageId.length === 0) return sendMessage({embeds: [channelNotFound]}).catch(err => {});
                    reactmessage = channel.messages.cache.get(createAction[messageIndex]);
                    if(!reactmessage){
                        try {
                            reactmessage = await channel.messages.fetch(createAction[messageIndex]);
                        } catch {
                            await wait(400);
                            return sendMessage({embeds: [messageNotFound]}).catch(err => {});
                        }
                    }
                } else if(idRegEx.test(createAction[0])){
                    if(!createAction[1]) return sendMessage({embeds: [invalidReply]}).catch(err => {});
                    if(!idRegEx.test(createAction[1])) return sendMessage({embeds: [invalidReply]}).catch(err => {});
                    try {
                        channel = await client.cache.getChannel(createAction[0], message.guild);
                        if(!channel){
                            await wait(400);
                            channel = await client.cache.getChannel(createAction[1], message.guild);
                            messageIndex = 0;
                            await wait(400);
                            if(!channel) return sendMessage({embeds: [channelNotFound]}).catch(err = {});
                        }
                    } catch {
                        try {
                            await wait(400);
                            channel = await client.cache.getChannel(createAction[1], message.guild);
                            messageIndex = 0;
                            await wait(400);
                        } catch {
                            await wait(400);
                            return sendMessage({embeds: [channelNotFound]}).catch(err = {});
                        }
                    }
                    reactmessage = channel.messages.cache.get(createAction[messageIndex]);
                    if(!reactmessage){
                        try {
                            reactmessage = await channel.messages.fetch(createAction[messageIndex]);
                        } catch {
                            await wait(400);
                            return sendMessage({embeds: [messageNotFound]}).catch(err => {});
                        }
                    }
                } else if(createAction[0].toLowerCase() === messages.moderation.react.actions.text.new.toLowerCase()){
                    const selectChannel = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                    .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["channel-select"].title))
                    .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["channel-select"].message, [{CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
                    .setTimestamp();

                    sendMessage({embeds: [selectChannel]}).catch(err => {});

                    const channelCollector = await createCollector();

                    if(typeof channelCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                    let channelCollectorArgs = channelCollector.content.toLowerCase().split(" ");

                    if(channelCollector.mentions.channels.first()){
                        channel = channelCollector.mentions.channels.first();
                    } else if(idRegEx.test(channelCollectorArgs[0])) {
                        try {
                            channel = await client.cache.getChannel(channelCollectorArgs[0], message.guild);
                            if(!channel) return sendMessage({embeds: [channelNotFound]}).catch(err = {});
                        } catch {
                            await wait(400);
                            return sendMessage({embeds: [channelNotFound]}).catch(err = {});
                        }
                    } else if(channelCollector.content.toLowerCase() === messages.moderation.react.actions.text.cancel.toLowerCase()){
                        return sendMessage({embeds: [cancelled]}).catch(err => {});
                    } else {
                        return sendMessage({embeds: [invalidReply]}).catch(err => {});
                    }
                } else if(createAction[0].toLowerCase() === messages.moderation.react.actions.text.cancel.toLowerCase()){
                    return sendMessage({embeds: [cancelled]}).catch(err => {});
                } else {
                    return sendMessage({embeds: [invalidReply]}).catch(err => {});
                }

                sendMessage({embeds: [reactionType]}).catch(err => {});
                
                const reactButtons = [];
                var allMsgButtons = [];
                if(reactmessage !== null){
                    const reactionMsgBtns = client.deepCopy(client.reactrole.get(reactmessage.id) || []);
                    allMsgButtons = reactionMsgBtns.filter(r => r.type === 'button').map(r => ButtonBuilder.from(r.button));
                    reactButtons.push(...allMsgButtons);
                }

                const reactionTypeCollector = await createCollector();

                if(typeof reactionTypeCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                let reactionTypeCollectorArgs = reactionTypeCollector.content.toLowerCase().split(" ");
                var emoji = button = option = null;
                switch(reactionTypeCollectorArgs[0]){
                    case messages.moderation.react.actions.text.button:
                        if(reactmessage !== null){
                            const onlyBot = new EmbedBuilder()
                            .setColor(`Red`)
                            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["button-not-bot"].title))
                            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["button-not-bot"].message))
                            .setTimestamp();
                            if(!reactmessage.member) return sendMessage({embeds: [onlyBot]}).catch(err => {});
                            if(reactmessage.member.user.id !== client.user.id) return sendMessage({embeds: [onlyBot]}).catch(err => {});
                        }
                        const reactionButton = new ButtonBuilder();

                        const buttonText = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["button-text"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["button-text"].message, [{CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
                        .setTimestamp();

                        sendMessage({embeds: [buttonText]}).catch(err => {});

                        const buttonTextCollector = await createCollector();
                        if(typeof buttonTextCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                        if(buttonTextCollector.content.toLowerCase() === messages.moderation.react.actions.text.cancel){
                            return sendMessage({embeds: [cancelled]}).catch(err => {});
                        } else {
                            var btnId = buttonTextCollector.content.toLowerCase().split(" ").join("-").slice(0, 60);
                            if(reactmessage === null){
                                reactionButton.setLabel(buttonTextCollector.content.slice(0, 60));
                                reactionButton.setCustomId(`react_role__${btnId}`);
                            } else {
                                const reactionMsgButtons = client.deepCopy(client.reactrole.get(reactmessage.id) || []);
                                const fBtnS = reactionMsgButtons.filter(r => r.button_id === btnId);
                                if(fBtnS.length > 0){
                                    const buttonExists = new EmbedBuilder()
                                    .setColor(`Red`)
                                    .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                                    .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["button-in-use"].title))
                                    .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["button-in-use"].message))
                                    .setTimestamp();

                                    return sendMessage({embeds: [buttonExists]}).catch(err => {});
                                }
                                if(allMsgButtons.length >= 5){
                                    const maxButtons = new EmbedBuilder()
                                    .setColor(`Red`)
                                    .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                                    .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["max-buttons"].title))
                                    .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["max-buttons"].message))
                                    .setTimestamp();

                                    return sendMessage({embeds: [maxButtons]}).catch(err => {});
                                }
                                reactionButton.setLabel(buttonTextCollector.content.slice(0, 60));
                                reactionButton.setCustomId(`react_role__${btnId}`);
                            }
                        }

                        const buttonColor = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["button-color"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["button-color"].message, [{BLURPLE_COLOR: messages.moderation.react.actions.text.blurple, GRAY_COLOR: messages.moderation.react.actions.text.gray, GREEN_COLOR: messages.moderation.react.actions.text.green, RED_COLOR: messages.moderation.react.actions.text.red, CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
                        .setTimestamp();

                        sendMessage({embeds: [buttonColor]}).catch(err => {});

                        const buttonColorCollector = await createCollector();
                        if(typeof buttonColorCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                        switch(buttonColorCollector.content.toLowerCase().split(" ")[0]){
                            case messages.moderation.react.actions.text.blurple:
                                reactionButton.setStyle(ButtonStyle.Primary);
                                break;
                            case messages.moderation.react.actions.text.gray:
                                reactionButton.setStyle(ButtonStyle.Secondary);
                                break;
                            case messages.moderation.react.actions.text.green:
                                reactionButton.setStyle(ButtonStyle.Success);
                                break;
                            case messages.moderation.react.actions.text.red:
                                reactionButton.setStyle(ButtonStyle.Danger);
                                break;
                            case messages.moderation.react.actions.text.cancel:
                                return sendMessage({embeds: [cancelled]}).catch(err => {});
                                break;
                            default:
                                return sendMessage({embeds: [invalidReply]}).catch(err => {});
                                break;
                        }

                        button = reactionButton;
                        reactButtons.push(reactionButton);
                        break;
                    case messages.moderation.react.actions.text.emoji:
                        const selectReaction = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-emoji"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-emoji"].message, [{CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
                        .setTimestamp();

                        sendMessage({embeds: [selectReaction]}).catch(err => {});

                        const reactionCollector = await createCollector();
                        if(typeof reactionCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                        const emote = reactionCollector.content.toLowerCase().split(" ")[0];
                        if(typeof emote !== 'string') return sendMessage({embeds: [invalidReply]}).catch(err => {});
                        console.log(validateEmote(emote), validateDiscordEmote(emote));
                        if(validateEmote(emote)){
                            emoji = emote;
                        } else if(validateDiscordEmote(emote)){
                            const emojiId = emote.split(">").join("").split(":")[2];
                            try {
                                const fetchedEmote = await message.guild.emojis.fetch(emojiId);
                                emoji = fetchedEmote;
                            } catch {
                                await wait(400);
                                return sendMessage({embeds: [invalidEmote]}).catch(err => {});
                            }
                        } else if(emote === messages.moderation.react.actions.text.cancel){
                            return sendMessage({embeds: [cancelled]}).catch(err => {});
                        } else {
                            return sendMessage({embeds: [invalidEmote]}).catch(err => {});
                        }

                        if(reactmessage !== null){
                            const fEmojiS = client.deepCopy(client.reactrole.get(reactmessage.id) || []).filter(r => r.emoji === emoji);
                            if(fEmojiS.length > 0){
                                const emojiExists = new EmbedBuilder()
                                .setColor(`Red`)
                                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["emoji-in-use"].title))
                                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["emoji-in-use"].message))
                                .setTimestamp();

                                return sendMessage({embeds: [emojiExists]}).catch(err => {});
                            }
                        }
                        break;
                    case messages.moderation.react.actions.text.selectmenu:
                        if(reactmessage !== null){
                            const onlyBot = new EmbedBuilder()
                            .setColor(`Red`)
                            .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["button-not-bot"].title))
                            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["button-not-bot"].message))
                            .setTimestamp();

                            if(!reactmessage.member) return sendMessage({embeds: [onlyBot]}).catch(err => {});
                            if(reactmessage.member.user.id !== client.user.id) return sendMessage({embeds: [onlyBot]}).catch(err => {});
                        }

                        if(reactmessage !== null){
                            const reactionSelectMenuData = client.deepCopy(client.reactrole.get(reactmessage.id) || []);
                            const getSelectMenuData = reactionSelectMenuData.filter(r =>  typeof r.selectMenuOpt === 'object' && r.selectMenuOpt !== null);
                            if(getSelectMenuData.length >= 24){
                                const maxRolesSelectMenu = new EmbedBuilder()
                                .setColor(`Red`)
                                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                                .setTitle(handleMessage(cllient, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["max-options-select-menu"].title))
                                .setDescription(handleMessage(cllient, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["max-options-select-menu"].message))
                                .setTimestamp();

                                return sendMessage({embeds: [maxRolesSelectMenu]}).catch(err => {});
                            }
                        }

                        const selectMenuText = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-menu-name-option"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-menu-name-option"].message, [{CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
                        .setTimestamp();

                        option = {
                            label: ``,
                            value: ``,
                            description: ``
                        };

                        sendMessage({embeds: [selectMenuText]}).catch(err => {});

                        const selectMenuNameCollector = await createCollector();
                        if(typeof selectMenuNameCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                        const allowedCharacters = `;:'",.?!:äëïüöÄËÏÖÜáéíúóÁÉÍÓÚ`.split("");
                        var messageContent = selectMenuNameCollector.content || '';
                        messageContent = messageContent.replace(/[А-Яа-яЁёA-Za-z0-9\u0621-\u064A ]/g, '').split(" ").join("");
                        const unallowedCharactersName = messageContent.split("").filter(c => allowedCharacters.indexOf(c) < 0);

                        if(selectMenuNameCollector.content.toLowerCase() === messages.moderation.react.actions.text.cancel){
                            return sendMessage({embeds: [cancelled]}).catch(err => {});
                        } else if((selectMenuNameCollector.content || '').length < 100 && (selectMenuNameCollector.content || '').length > 0 && unallowedCharactersName.length === 0){
                            option.label = selectMenuNameCollector.content;
                            option.value = selectMenuNameCollector.content.toLowerCase().split(" ").join("-");
                        } else {
                            const invalidSelectMenuName = new EmbedBuilder()
                            .setColor(`Red`)
                            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["invalid-select-menu-name"].title))
                            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["invalid-select-menu-name"].message))
                            .setTimestamp();

                            if((selectMenuNameCollector.content || '').length > 100 || (selectMenuNameCollector.content || '').length < 1){
                                return sendMessage({embeds: [invalidSelectMenuName]}).catch(err => {});
                            } else {
                                var removeEmotes = (selectMenuNameCollector.content || '').split("").filter(c => validateEmote(c));
                                messageContent = (selectMenuNameCollector.content || '').split(" ").join("");
                                for(var i = 0; i < removeEmotes.length; i++){
                                    var contentEmote = removeEmotes[i];
                                    messageContent = messageContent.split(contentEmote).join("");
                                }
                                messageContent = messageContent.replace(/[А-Яа-яЁёA-Za-z0-9\u0621-\u064A ]/g, '').split(" ").join("");
                                const unallowedCharacters2 = messageContent.split("").filter(c => allowedCharacters.indexOf(c) < 0);
                                if((unallowedCharacters2.length - removeEmotes.length) === 0){
                                    option.label = selectMenuNameCollector.content;
                                    option.value = selectMenuNameCollector.content.toLowerCase().split(" ").join("-");
                                } else {
                                    return sendMessage({embeds: [invalidSelectMenuName]}).catch(err => {});                                    
                                }
                            }
                        }

                        const selectMenuDescription = new EmbedBuilder()
                        .setColor(client.embedColor)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-menu-description-option"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["select-menu-description-option"].message))
                        .setTimestamp();

                        sendMessage({embeds: [selectMenuDescription]}).catch(err => {});

                        const selectMenuDescriptionCollector = await createCollector();
                        if(typeof selectMenuDescriptionCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});
                        
                        var messageContentDescription = selectMenuDescriptionCollector.content || '';
                        const unallowedCharactersDescription = messageContentDescription.split("").filter(c => allowedCharacters.indexOf(c) < 0);

                        if(selectMenuDescriptionCollector.content.toLowerCase() === messages.moderation.react.actions.text.cancel){
                            return sendMessage({embeds: [cancelled]}).catch(err => {});
                        } else if((selectMenuDescriptionCollector.content || '').length < 100 && (selectMenuDescriptionCollector.content || '').length > 0 && unallowedCharactersDescription.length === 0){
                            option.description = selectMenuDescriptionCollector.content;
                        } else {
                            const invalidSelectMenuDescription = new EmbedBuilder()
                            .setColor(`Red`)
                            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["invalid-select-menu-description"].title))
                            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["invalid-select-menu-description"].message))
                            .setTimestamp();

                            if((selectMenuDescriptionCollector.content || '').length > 100 || (selectMenuDescriptionCollector.content || '').length < 1){
                                return sendMessage({embeds: [invalidSelectMenuDescription]}).catch(err => {});
                            } else {
                                var removeEmotesDescription = (selectMenuDescriptionCollector.content || '').split("").filter(c => validateEmote(c));
                                messageContentDescription = selectMenuDescriptionCollector.content || '';
                                for(var i = 0; i < removeEmotesDescription.length; i++){
                                    var contentEmoteDescription = removeEmotesDescription[i];
                                    messageContentDescription = messageContentDescription.split(contentEmoteDescription).join("");
                                }
                                messageContentDescription = messageContentDescription.replace(/[А-Яа-яЁёA-Za-z0-9\u0621-\u064A ]/g, '').split(" ").join("");
                                const unallowedCharacters3 = messageContentDescription.split("").filter(c => allowedCharacters.indexOf(c) < 0);
                                if((unallowedCharacters3.length - removeEmotesDescription.length) === 0){
                                    option.description = selectMenuDescriptionCollector.content;
                                } else {
                                    return sendMessage({embeds: [invalidSelectMenuDescription]}).catch(err => {});                                    
                                }
                            }
                        }
                        break;
                    case messages.moderation.react.actions.text.cancel:
                        return sendMessage({embeds: [cancelled]}).catch(err => {});
                        break;
                    default: 
                        return sendMessage({embeds: [invalidReply]}).catch(err => {});
                        break;
                }
                var role;

                sendMessage({embeds: [selectRole]}).catch(err => {});
                
                const roleCollector = await createCollector();
                if(typeof roleCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});
                if(roleCollector.mentions.roles.first()){
                    role = roleCollector.mentions.roles.first();
                } else {
                    const roleArg = roleCollector.content.split(" ")[0];
                    if(idRegEx.test(role)){
                        try {
                            role = await client.cache.getRole(roleArg, message.guild);
                            if(!role) return sendMessage({embeds: [roleNotFound]});
                        } catch {
                            await wait(400);
                            return sendMessage({embeds: [roleNotFound]});
                        }
                    } else if(roleArg === messages.moderation.react.actions.text.cancel){
                        return sendMessage({embeds: [cancelled]}).catch(err => {});
                    } else {
                        const roleSearch1 = message.guild.roles.cache.filter(r => r.name.toLowerCase() === roleArg.toLowerCase()).first();
                        if(!roleSearch1){
                            const roleSearch2 = message.guild.roles.cache.filter(r => r.name.toLowerCase().includes(roleArg.toLowerCase())).first();
                            if(!roleSearch2){
                                const roleSearch3 = message.guild.roles.cache.filter(r => roleArg.toLowerCase().includes(r.name.toLowerCase())).first();
                                if(!roleSearch3) return sendMessage({embeds: [roleNotFound]}).catch(err => {});
                                else role = roleSearch3;
                            } else {
                                role = roleSearch2;
                            }
                        } else {
                            role = roleSearch1;
                        }
                    }
                }

                if(reactmessage !== null){
                    const reactMsgRoles = client.deepCopy(client.reactrole.get(reactmessage.id) || []).filter(r => r.role === role.id);
                    if(reactMsgRoles.length > 0){
                        const roleExists = new EmbedBuilder()
                        .setColor(`Red`)
                        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["role-in-use"].title))
                        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions["error-messages"]["role-in-use"].message))
                        .setTimestamp();

                        return sendMessage({embeds: [roleExists]}).catch(err => {});
                    }
                }

                let msgType = emoji !== null ? messages.moderation.react.actions.create["confirm-message"].emoji : (button !== null ? messages.moderation.react.actions.create["confirm-message"].button : messages.moderation.react.actions.create["confirm-message"].option);

                const confirmMsg = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["confirm-message"].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["confirm-message"].message, [{ROLE_MENTION: `<@&${role.id}>`, A_AN: /^[aeiou]*$/.test(msgType.toLowerCase().slice(0, 1)) ? messages.moderation.react.actions.create["confirm-message"].an : messages.moderation.react.actions.create["confirm-message"].a, ACTION_TYPE: msgType}]))
                .setTimestamp();

                const confirmBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId('confirm-react-role-create')
                .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["confirm-message"].confirm));

                const cancelBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId('cancel-react-role-create')
                .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.create["confirm-message"].cancel));

                const actionRow = new ActionRowBuilder()
                .addComponents(confirmBtn, cancelBtn);

                let msg;
                try{
                    msg = await sendMessage({embeds: [confirmMsg], components: [actionRow]});
                } catch {
                    return;
                }

                const componentCollector = msg.createMessageComponentCollector({
                    filter: i => i.member.id === message.member.id,
                    max: 1,
                    time: 3*6e4
                });

                componentCollector.on('collect', i => {
                    if(i.customId === 'cancel-react-role-create'){
                        return i.message.delete().catch(err => {});
                    } else {
                        client.interactionActions.set('react-start-'+message.member.id+'-'+message.guild.id+'-'+role.id, {reactMessage: (reactmessage !== null ? {id: reactmessage.id, channel: channel.id} : null), actionType: createAction[0].toLowerCase(), role: role.id, emoji: emoji !== null ? (emoji instanceof GuildEmoji ? emoji.toString() : emoji) : null, button: button !== null ? button.toJSON() : null, type: (emoji !== null ? 'emoji' : (button !== null ? 'button' : 'selectMenu')), channel: channel.id, guild: message.guild.id, button_id: button !== null ? button.toJSON().custom_id : null, selectMenuOpt: option !== null ? option : null, customized: false});

                        const customMsg = new TextInputBuilder()
                        .setCustomId('custom-msg')
                        .setLabel('Custom message')
                        .setMaxLength(100)
                        .setMinLength(1)
                        .setRequired(false)
                        .setPlaceholder('No message provided')
                        .setStyle(TextInputStyle.Short)
                        .setValue((emoji !== null ? messages["react-message"].emoji.message : (button !== null ? messages["react-message"].button.message : messages["react-message"].selectmenu.message)));

                        const modal = new ModalBuilder()
                        .setComponents(new ActionRowBuilder().addComponents(customMsg))
                        .setTitle('Custom message')
                        .setCustomId('react-role-custom-msg__'+role.id);

                        i.showModal(modal).catch(err => {});
                    }
                });

                componentCollector.on('end', (collected) => {
                    if(collected.size === 0) return msg.delete().catch(err => {});
                });
                break;
            case 'delete':
                const selectDeleteAction = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.delete["delete-action"].title))
                .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.delete["delete-action"].message, [{MESSAGE_TEXT: messages.moderation.react.actions.text.message, REACTION_TEXT: messages.moderation.react.actions.text.reaction, CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
                .setTimestamp();

                try {
                    sendMessage({embeds: [selectDeleteAction]});
                    interaction = false;
                    sendMessage = client.sendMessage(message, interaction);
                } catch {
                    await wait(500);
                    return sendMessage({embeds: [unknownErr]}).catch(err => {});
                }

                const deleteActionCollector = await createCollector();
                if(typeof deleteActionCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                const deleteAction = deleteActionCollector.content.toLowerCase().split(" ");
                switch(deleteAction[0]){
                    case messages.moderation.react.actions.text.message:
                        sendMessage({embeds: [messageIdEmbed]}).catch(err => {});

                        const messageIdCollector = await createCollector();
                        if(typeof messageIdCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                        const messageId = messageIdCollector.content.toLowerCase().split(" ")[0];
                        if(messageId === messages.moderation.react.actions.text.cancel){
                            return sendMessage({embeds: [cancelled]}).catch(err => {});
                        } else if(idRegEx.test(messageId)){
                            let reactMessage = client.reactrole.get(messageId);
                            if(!reactMessage) return sendMessage({embeds: [messageNotFound]}).catch(err => {});
                            reactMessage = client.deepCopy(reactMessage);
                            var reactChannel;
                            try {
                                reactChannel = await client.cache.getChannel(reactMessage[0].channel, message.guild);
                                if(!reactChannel) return sendMessage({embeds: [channelNotFound]}).catch(err => {});
                            } catch {
                                return sendMessage({embeds: [channelNotFound]}).catch(err => {});
                            }
                            var reactMsg = reactChannel.messages.cache.get(messageId);
                            if(!reactMsg){
                                try {
                                    reactMsg = await reactChannel.messages.fetch(messageId);
                                } catch {
                                    return sendMessage({embeds: [messageNotFound]}).catch(err => {});
                                }
                            }
                            try{
                                await client.dbHandler.deleteValue(`reactrole`, {}, {messageId: messageId, channelId: reactChannel.id, guildId: message.guild.id});
                            } catch {}
                            await wait(200);
                            reactMsg.delete().catch(err => {});

                            const deletedMessage = new EmbedBuilder()
                            .setColor(client.embedColor)
                            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                            .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.delete["message-deleted"].title))
                            .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages.moderation.react.actions.delete["message-deleted"].message))
                            .setTimestamp();

                            await wait(400);

                            sendMessage({embeds: [deletedMessage]}).catch(err => {});
                        } else {
                            return sendMessage({embeds: [invalidReply]}).catch(err => {});
                        }
                        break;
                    case messages.moderation.react.actions.text.reaction:
                        sendMessage({embeds: [messageIdEmbed]}).catch(err => {});
                        
                        const removeReactionMessageCollector = await createCollector();
                        if(typeof removeReactionMessageCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                        const reactionMessageId = removeReactionMessageCollector.content.toLowerCase().split(" ")[0];
                        if(reactionMessageId === messages.moderation.react.actions.text.cancel){
                            return sendMessage({embeds: [cancelled]}).catch(err => {});
                        } else if(idRegEx.test(reactionMessageId)){
                            let reactMessage = client.reactrole.get(reactionMessageId);
                            if(!reactMessage) return sendMessage({embeds: [messageNotFound]}).catch(err => {});
                            reactMessage = client.deepCopy(reactMessage);
                            var reactChannel;
                            try {
                                reactChannel = await client.cache.getChannel(reactMessage[0].channel, message.guild);
                                if(!reactChannel) return sendMessage({embeds: [channelNotFound]}).catch(err => {});
                            } catch {
                                return sendMessage({embeds: [channelNotFound]}).catch(err => {});
                            }
                            var reactMsg = reactChannel.messages.cache.get(reactionMessageId);
                            if(!reactMsg){
                                try {
                                    reactMsg = await reactChannel.messages.fetch(reactionMessageId);
                                } catch {
                                    return sendMessage({embeds: [messageNotFound]}).catch(err => {});
                                }
                            }

                            const selectDeleteRole = new EmbedBuilder()
                            .setColor(client.embedColor)
                            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                            .setTitle(handleMessage(client, message.member.user, undefined, reactChannel, messages.moderation.react.actions.delete["select-role"].title))
                            .setDescription(handleMessage(client, message.member.user, undefined, reactChannel, messages.moderation.react.actions.delete["select-role"].message, [{CANCEL_TEXT: messages.moderation.react.actions.text.cancel}]))
                            .setTimestamp();

                            sendMessage({embeds: [selectDeleteRole]}).catch(err => {});

                            const roleDeleteCollector = await createCollector();
                            if(typeof roleDeleteCollector === 'undefined') return sendMessage({embeds: [abortedTime]}).catch(err => {});

                            var role;
                            if(roleDeleteCollector.mentions.roles.first()){
                                role = roleDeleteCollector.mentions.roles.first();
                            } else {
                                const roleArg = roleDeleteCollector.content.split(" ")[0];
                                if(idRegEx.test(role)){
                                    try {
                                        role = await client.cache.getRole(roleArg, message.guild);
                                        if(!role) return sendMessage({embeds: [roleNotFound]}).catch(err => {});
                                    } catch {
                                        await wait(400);
                                        return sendMessage({embeds: [roleNotFound]});
                                    }
                                } else if(roleArg === messages.moderation.react.actions.text.cancel){
                                    return sendMessage({embeds: [cancelled]}).catch(err => {});
                                } else {
                                    const roleSearch1 = message.guild.roles.cache.filter(r => r.name.toLowerCase() === roleArg.toLowerCase()).first();
                                    if(!roleSearch1){
                                        const roleSearch2 = message.guild.roles.cache.filter(r => r.name.toLowerCase().includes(roleArg.toLowerCase())).first();
                                        if(!roleSearch2){
                                            const roleSearch3 = message.guild.roles.cache.filter(r => roleArg.toLowerCase().includes(r.name.toLowerCase())).first();
                                            if(!roleSearch3) return sendMessage({embeds: [roleNotFound]}).catch(err => {});
                                            else role = roleSearch3;
                                        } else {
                                            role = roleSearch2;
                                        }
                                    } else {
                                        role = roleSearch1;
                                    }
                                }
                            }

                            const getRoleFromSave = reactMessage.filter(r => r.role === role.id);
                            if(getRoleFromSave.length === 0) return sendMessage({embeds: [roleNotFound]}).catch(err => {});

                            if(getRoleFromSave[0].emoji !== null){
                                try {
                                    if(validateDiscordEmote(getRoleFromSave[0].emoji)){
                                        const deleteEmojiId = getRoleFromSave[0].emoji.split(">").join("").split(":")[2];
                                        await reactMsg.reactions.resolve(deleteEmojiId).remove();
                                    } else await reactMsg.reactions.resolve(getRoleFromSave[0].emoji).remove();
                                } catch(err) {
                                    await wait(400);
                                    return sendMessage({embeds: [unknownErr]}).catch(err => {});
                                }
                            }

                            const index = reactMessage.indexOf(getRoleFromSave[0]);
                            if(index < 0) return sendMessage({embeds: [unknownErr]}).catch(err => {});

                            reactMessage.splice(index, 1);

                            const roleRemoved = new EmbedBuilder()
                            .setColor(client.embedColor)
                            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                            .setTitle(handleMessage(client, message.member.user, undefined, reactChannel, messages.moderation.react.actions.delete["role-removed"].title))
                            .setDescription(handleMessage(client, message.member.user, undefined, reactChannel, messages.moderation.react.actions.delete["role-removed"].message, [{MESSAGE_URL: `https://discord.com/channels/${reactMsg.guild.id}/${reactMsg.channel.id}/${reactMsg.id}`, ROLE_MENTION: `<@&${role.id}>`}]))
                            .setTimestamp();

                            if(reactMessage.length === 0){
                                try{
                                    await client.dbHandler.deleteValue(`reactrole`, {}, {messageId: reactionMessageId, channelId: reactMsg.channel.id, roleId: role.id, guildId: message.guild.id});
                                } catch {}
                                await wait(400);
                                reactMsg.delete().catch(err => {});
                            } else {
                                try{
                                    await client.dbHandler.deleteValue(`reactrole`, {}, {messageId: reactionMessageId, channelId: reactMsg.channel.id, roleId: role.id, guildId: message.guild.id});
                                } catch {}

                                const editedMessage = new EmbedBuilder()
                                .setColor(client.embedColor)
                                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                                .setTitle(handleMessage(client, message.member.user, undefined, reactChannel, messages["react-message"].button.title))
                                .setTimestamp();

                                var description = '';
                                for(var i = 0; i < reactMessage.length; i++){
                                    if(reactMessage[i].type === 'button') description += `${handleMessage(client, message.member.user, undefined, reactChannel, reactMessage[i].msg ?? messages["react-message"].button.message, [{ROLE_MENTION: `<@&${reactMessage[i].role}>`, LABEL: reactMessage[i].button.label}])}\n`;
                                    else if(reactMessage[i].type === 'emoji') description += `${handleMessage(client, message.member.user, undefined, reactChannel, reactMessage[i].msg ?? messages["react-message"].emoji.message, [{ROLE_MENTION: `<@&${reactMessage[i].role}>`, EMOJI: reactMessage[i].emoji}])}\n`;
                                    else if(reactMessage[i].type === 'selectMenu') description += `${handleMessage(client, message.member.user, undefined, reactChannel, reactMessage[i].msg ?? messages["react-message"].selectmenu.message, [{ROLE_MENTION: `<@&${reactMessage[i].role}>`, LABEL: reactMessage[i].selectMenuOpt.label}])}\n`;
                                }

                                editedMessage.setDescription(description);

                                var content = {embeds: [editedMessage], components: []};
                                const buttons = reactMessage.filter(r => r.type === 'button').map(r => ButtonBuilder.from(r.button));
                                const selectMenuOptions = reactMessage.filter(r => r.type === 'selectMenu');

                                if(buttons.length > 0){
                                    const actionRow = new ActionRowBuilder().addComponents(buttons);
                                    content['components'].push(actionRow);
                                }
                                if(selectMenuOptions.length > 0){
                                    const roleSelectMenu = new StringSelectMenuBuilder()
                                    .setCustomId(`react_role`)
                                    .setOptions([{
                                        label: 'Choose a role',
                                        value: '>react_role__select_option',
                                        default: true
                                    },...selectMenuOptions.map(r => r.selectMenuOpt)]);
                                    const roleSelectMenuActionRow = new ActionRowBuilder().addComponents(roleSelectMenu);
                                    content['components'].push(roleSelectMenuActionRow);
                                }

                                reactMsg.edit(client.handleContent(message, content)).catch(err => {});
                            }
                            await wait(400);
                            sendMessage({embeds: [roleRemoved]}).catch(err => {});
                        } else {
                            return sendMessage({embeds: [invalidReply]}).catch(err => {});
                        }
                        break;
                    case messages.moderation.react.actions.text.cancel:
                        return sendMessage({embeds: [cancelled]}).catch(err => {});
                        break;
                    default:
                        return sendMessage({embeds: [invalidReply]}).catch(err => {});
                        break;
                }
                break;
        }
    }
}
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');
const { wait, validateDiscordEmote } = require('../functions.js');
const { EmbedBuilder, ButtonBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'react-role-custom-msg',
        description: 'When a reaction role should be created'
    },
    run: async function(client, interaction){
        const roleId = interaction.customId.split('__')[1];

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.react['error-messages']['unknown-interaction'].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.react['error-messages']['unknown-interaction'].message))
        .setTimestamp();

        if(!roleId) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const interactionInfo = client.interactionActions.get('react-start-'+interaction.member.id+'-'+interaction.guild.id+'-'+roleId);

        const customMessage = interaction.fields.getTextInputValue('custom-msg') ?? messages['react-message'][interactionInfo.type.toLowerCase()].message;

        interactionInfo['msg'] = customMessage;

        let channel = await client.cache.getChannel(interactionInfo.channel, interaction.guild);

        if(!channel) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        if(interactionInfo.actionType === messages.moderation.react.actions.text.new){
            if(interactionInfo.emoji !== null){
                const reactEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.member.user, undefined, channel, messages["react-message"].emoji.title, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, EMOJI: interactionInfo.emoji}]))
                .setDescription(handleMessage(client, interaction.member.user, undefined, channel, customMessage, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, EMOJI: interactionInfo.emoji}]))
                .setTimestamp();

                channel.send(client.handleContent(interaction, {embeds: [reactEmbed]})).then(async msg => {
                    let validation = validateDiscordEmote(interactionInfo.emoji);
                    let reactEmote = interactionInfo.emoji;
                    if(validation){
                        reactEmote = interaction.guild.emojis.cache.filter(e => e.toString() === reactEmote).first();
                    }
                    await wait(400);
                    msg.react(reactEmote).catch(err => {});

                    delete interactionInfo['reactMessage'];
                    delete interactionInfo['actionType'];

                    try{
                        await client.dbHandler.setValue(`reactrole`, {...interactionInfo}, {messageId: msg.id, channelId: msg.channel.id, roleId: interactionInfo.role, guildId: interaction.guild.id});
                    } catch {}

                    await wait(400);

                    const messageCreated = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.react.actions.create["reaction-created"].title))
                    .setDescription(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.react.actions.create["reaction-created"].message, [{MESSAGE_URL: `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`}]))
                    .setTimestamp();
                    interaction.update({embeds: [messageCreated], components: []}).catch(err => {});
                }).catch(err => {});
            } else if(interactionInfo.button !== null){
                const reactEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.member.user, undefined, channel, messages["react-message"].button.title, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, LABEL: interactionInfo.button.label}]))
                .setDescription(handleMessage(client, interaction.member.user, undefined, channel, customMessage, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, LABEL: interactionInfo.button.label}]))
                .setTimestamp();

                const reactButtons = [ButtonBuilder.from(interactionInfo.button)];

                const roleActionRow = new ActionRowBuilder().addComponents(reactButtons);

                delete interactionInfo['reactMessage'];
                delete interactionInfo['actionType'];

                channel.send(client.handleContent(interaction, {embeds: [reactEmbed], components: [roleActionRow]})).then(async msg => {
                    try{
                        await client.dbHandler.setValue(`reactrole`, {...interactionInfo}, {messageId: msg.id, channelId: msg.channel.id, roleId: interactionInfo.role});
                    } catch {}

                    await wait(400);

                    const messageCreated = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.react.actions.create["reaction-created"].title))
                    .setDescription(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.react.actions.create["reaction-created"].message, [{MESSAGE_URL: `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`}]))
                    .setTimestamp();
                    interaction.update({embeds: [messageCreated], components: []}).catch(err => {});
                }).catch(err => {});
            } else if(interactionInfo.selectMenuOpt !== null){
                const selectMenu = new StringSelectMenuBuilder()
                .setOptions([{
                    label: 'Choose a role',
                    value: '>react_role__select_option',
                    default: true
                }, {
                    label: interactionInfo.selectMenuOpt.label,
                    value: interactionInfo.selectMenuOpt.value,
                    description: interactionInfo.selectMenuOpt.description
                }])
                .setCustomId(`react_role`);

                delete interactionInfo['reactMessage'];
                delete interactionInfo['actionType'];

                const reactEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.member.user, undefined, channel, messages["react-message"].selectmenu.title, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, LABEL: interactionInfo.selectMenuOpt.label}]))
                .setDescription(handleMessage(client, interaction.member.user, undefined, channel, customMessage, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, LABEL: interactionInfo.selectMenuOpt.label}]))
                .setTimestamp();
                const roleActionRow = new ActionRowBuilder().addComponents(selectMenu);

                channel.send(client.handleContent(interaction, {embeds: [reactEmbed], components: [roleActionRow]})).then(async msg => {
                    try{
                        await client.dbHandler.setValue(`reactrole`, {...interactionInfo}, {messageId: msg.id, channelId: msg.channel.id, roleId: interactionInfo.role});
                    } catch {}

                    await wait(400);

                    const messageCreated = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.react.actions.create["reaction-created"].title))
                    .setDescription(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.react.actions.create["reaction-created"].message, [{MESSAGE_URL: `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`}]))
                    .setTimestamp();
                    interaction.update({embeds: [messageCreated], components: []}).catch(err =>{});
                }).catch(err =>{});
            }
        } else if(interactionInfo.reactMessage !== null) {

            let reactChannel = await client.cache.getChannel(interactionInfo.reactMessage.channel, interaction.guild);
            if(!reactChannel) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

            let reactmessage = reactChannel.messages.cache.get(interactionInfo.reactMessage.id);
            if(!reactmessage){
                try{
                    reactmessage = await reactChannel.messages.fetch(interactionInfo.reactMessage.id);
                } catch {
                    return interaction.update({embeds: [unknownInteraction], components: []});
                }
            }
                
            const messageCreated = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, reactChannel, messages.moderation.react.actions.create["reaction-created"].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, reactChannel, messages.moderation.react.actions.create["reaction-created"].message, [{MESSAGE_URL: `https://discord.com/channels/${interaction.guild.id}/${interactionInfo.reactMessage.channel}/${interactionInfo.reactMessage.id}`}]))
            .setTimestamp();
            
            delete interactionInfo['reactMessage'];
            delete interactionInfo['actionType'];

            var type = 'emoji';
            if(interactionInfo.button !== null) type = 'button';
            else if(interactionInfo.selectMenuOpt !== null) type = 'selectMenu';

            var emojiEmbed = null;
            if(interactionInfo.emoji !== null) emojiEmbed = validateDiscordEmote(interactionInfo.emoji) ? interaction.guild.emojis.cache.filter(e => e.toString() === interactionInfo.emoji).first() : interactionInfo.emoji;
            const reactionTypes = client.deepCopy(client.reactrole.get(reactmessage.id) || []);
            if(reactmessage.member.user.id !== client.user.id){
                interactionInfo['customized'] = true;
                try{
                    await client.dbHandler.setValue(`reactrole`, {...interactionInfo}, {messageId: reactmessage.id, channelId: reactmessage.channel.id, roleId: interactionInfo.role});
                } catch {}
                if(emoji !== null){
                    reactmessage.react(emoji).catch(err => {});
                }
                await wait(400);
                return interaction.update({embeds: [messageCreated], components: []}).catch(err => {});
            }

            let editedMessage;
            
            if(reactionTypes.filter(r => r.customized === true).length > 0 || reactionTypes.length === 0){
                interactionInfo['customized'] = true;
                editedMessage = EmbedBuilder.from(reactmessage.embeds[0]);
            } else {
                editedMessage = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.member.user, undefined, reactChannel, (interactionInfo.emoji !== null ? messages['react-message'].emoji.title : (interactionInfo.button !== null ? messages["react-message"].button.title : messages['react-message'].selectmenu.title))))
                .setTimestamp();

                var description = '';
                for(var i = 0; i < reactionTypes.length; i++){
                    if(reactionTypes[i].type === 'button') description += `${handleMessage(client, interaction.member.user, undefined, reactChannel, reactionTypes[i]['msg'] ?? messages["react-message"].button.message, [{ROLE_MENTION: `<@&${reactionTypes[i].role}>`, LABEL: reactionTypes[i].button.label}])}\n`;
                    else if(reactionTypes[i].type === 'emoji') description += `${handleMessage(client, interaction.member.user, undefined, reactChannel, reactionTypes[i]['msg'] ?? messages["react-message"].emoji.message, [{ROLE_MENTION: `<@&${reactionTypes[i].role}>`, EMOJI: reactionTypes[i].emoji}])}\n`;
                    else if(reactionTypes[i].type === 'selectMenu') description += `${handleMessage(client, interaction.member.user, undefined, reactChannel, reactionTypes[i]['msg'] ?? messages["react-message"].selectmenu.message, [{ROLE_MENTION: `<@&${reactionTypes[i].role}>`, LABEL: reactionTypes[i].selectMenuOpt.label}])}\n`;
                }
                if(interactionInfo.emoji !== null){
                    description += `${handleMessage(client, interaction.member.user, undefined, reactChannel, customMessage, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, EMOJI: emojiEmbed}])}`;
                } else if(interactionInfo.button !== null){
                    description += `${handleMessage(client, interaction.member.user, undefined, reactChannel, customMessage, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, LABEL: interactionInfo.button.label}])}`;
                } else if(interactionInfo.selectMenuOpt !== null){
                    description += `${handleMessage(client, interaction.member.user, undefined, reactChannel, customMessage, [{ROLE_MENTION: `<@&${interactionInfo.role}>`, LABEL: interactionInfo.selectMenuOpt.label}])}\n`;
                }

                editedMessage.setDescription(description);
            }

            var content = {embeds: [editedMessage]};
            const reactButtons = reactionTypes.filter(r => r.type === 'button').map(r => r.button);
            if(interactionInfo.type === 'button') reactButtons.push(interactionInfo.button);
            if(reactButtons.length > 0){
                var btns = [];
                for(var i = 0; i < reactButtons.length; i++){
                    btns.push(ButtonBuilder.from(reactButtons[i]));
                }
                const actionRow = new ActionRowBuilder().addComponents(btns);
                content['components'] = [actionRow];
            }
            const filterSelectMenuOptions = reactionTypes.filter(r => typeof r.selectMenuOpt === 'object' && r.selectMenuOpt !== null);
            const selectMenuOptions = [];
            if(filterSelectMenuOptions.length > 0){
                selectMenuOptions.push(...filterSelectMenuOptions.map(r => {
                    return {label: r.selectMenuOpt.label, value: r.selectMenuOpt.value, description: r.selectMenuOpt.description};
                }));
            }
            if(interactionInfo.selectMenuOpt !== null){
                selectMenuOptions.push({
                    label: interactionInfo.selectMenuOpt.label,
                    value: interactionInfo.selectMenuOpt.value,
                    description: interactionInfo.selectMenuOpt.description
                });
            }

            if(selectMenuOptions.length > 0){
                const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`react_role`)
                .setOptions([{
                    label: 'Choose a role',
                    value: '>react_role__select_option',
                    default: true
                }, ...selectMenuOptions]);
                const selectMenuActionRow = new ActionRowBuilder().addComponents(selectMenu);
                if(typeof content['components'] === 'object'){
                    content['components'].push(selectMenuActionRow);
                } else {
                    content['components'] = [selectMenuActionRow];
                }
            }

            reactmessage.edit(content).then(async msg => {
                if(interactionInfo.emoji !== null){
                    await wait(400);
                    msg.react(emojiEmbed).catch(err => {});
                }
                try{
                    await client.dbHandler.setValue(`reactrole`, {...interactionInfo}, {messageId: msg.id, channelId: msg.channel.id, roleId: interactionInfo.role});
                } catch {}

                await wait(400);

                interaction.update({embeds: [messageCreated], components: []}).catch(err => {});
            }).catch(err =>{});
        }
    }
}
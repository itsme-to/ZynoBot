const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");
const { validateURL, validateImage, wait } = require("../../functions.js");

module.exports = {
    data: {
        id: 'embed-builder-set',
        description: 'When a field needs to be added to the embed'
    },
    run: async function(client, interaction){
        await wait(300);
        const interactionInfo = interaction.customId.split("__")[1].toLowerCase();
        const interactionType = interactionInfo.split('-')[1];
        const memberId = interactionInfo.split('-')[0];

        const invalidUser = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-user"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-user"].message))
        .setTimestamp();

        if(memberId !== interaction.member.id) return interaction.reply({embeds: [invalidUser], ephemeral: true}).catch(err => {});

        const embedObject = client.interactionActions.get(`embed-builder-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["unknown-interaction"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["unknown-interaction"].message))
        .setTimestamp();

        if(!embedObject) return interaction.reply({embeds: [unknownInteraction]}).catch(err => {});

        const invalidURL = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-url"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-url"].message))
        .setTimestamp();
        const invalidImage = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-image"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-image"].message))
        .setTimestamp();
        const invalidTimestamp = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-timestamp"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-timestamp"].message))
        .setTimestamp();
        const invalidColor = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-color"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-color"].message))
        .setTimestamp();
        const channelNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["channel-not-found"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["channel-not-found"].message))
        .setTimestamp();
        const unknownError = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["unknown-error"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["unknown-error"].message))
        .setTimestamp();

        const input = interaction.fields.getTextInputValue(`embed-builder-${interactionType}`);

        switch(interactionType){
            case 'url':
                if(!validateURL(input)){
                    return interaction.reply({embeds: [invalidURL], ephemeral: true}).catch(err => {});
                } else {
                    embedObject[interactionType] = input;
                    interaction.deferUpdate().catch(err => {});
                }
                break;
            case 'thumbnail':
                if(!validateURL(input)){
                    return interaction.reply({embeds: [invalidURL], ephemeral: true}).catch(err => {});
                } else {
                    try{
                        await validateImage(input);
                        embedObject[interactionType] = input;
                        interaction.deferUpdate().catch(err => {});
                    } catch (err){
                        return interaction.reply({embeds: [invalidImage], ephemeral: true}).catch(err => {});
                    }
                }
                break;
            case 'image':
                if(!validateURL(input)){
                    return interaction.reply({embeds: [invalidURL], ephemeral: true}).catch(err => {});
                } else {
                    try{
                        await validateImage(input);
                        embedObject[interactionType] = input;
                        interaction.deferUpdate().catch(err => {});
                    } catch (err){
                        return interaction.reply({embeds: [invalidImage], ephemeral: true}).catch(err => {});
                    }
                }
                break;
            case 'author image':
                if(!validateURL(input)){
                    return interaction.reply({embeds: [invalidURL], ephemeral: true}).catch(err => {});
                } else {
                    validateImage(input).then(() => {
                        embedObject[interactionType] = input;
                        interaction.deferUpdate().catch(err => {});
                    }).catch(() => {
                        return interaction.reply({embeds: [invalidImage], ephemeral: true}).catch(err => {});
                    });
                }
                break;
            case 'footer image':
                if(!validateURL(input)){
                    return interaction.reply({embeds: [invalidURL], ephemeral: true}).catch(err => {});
                } else {
                    validateImage(input).then(() => {
                        embedObject[interactionType] = input;
                        interaction.deferUpdate().catch(err => {});
                    }).catch(() => {
                        return interaction.reply({embeds: [invalidImage], ephemeral: true}).catch(err => {});
                    });
                }
                break;
            case 'timestamp':
                if((input || '').length === 0){
                    embedObject[interactionType] = new Date().getTime();
                    interaction.deferUpdate().catch(err => {});
                } else if(!Number(input)){
                    return interaction.reply({embeds: [invalidTimestamp], ephemeral: true}).catch(err => {});
                } else {
                    embedObject[interactionType] = Number(input);
                    interaction.deferUpdate().catch(err => {});
                }
                break;
            case 'color':
                let colorRegEx = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                if(!colorRegEx.test(input)){
                    return interaction.reply({embeds: [invalidColor], ephemeral: true}).catch(err => {});
                } else {
                    embedObject[interactionType] = input;
                    interaction.deferUpdate().catch(err => {});
                }
                break;
            case 'send':
                var channel;
                if(/^[0-9]*$/.test(input)){
                    try{
                        channel = await client.cache.getChannel(input, interaction.guild);
                    } catch {
                        return interaction.reply({embeds: [channelNotFound], ephemeral: true}).catch(err => {});
                    }
                    if(!channel) return interaction.reply({embeds: [channelNotFound], ephemeral: true}).catch(err => {});
                } else {
                    const channelFilter1 = interaction.guild.channels.cache.filter(ch => ch.name.toLowerCase() === input.toLowerCase() && ch.type === ChannelType.GuildText).first();
                    if(channelFilter1){
                        channel = channelFilter1;
                    } else {
                        const channelFilter2 = interaction.guild.channels.cache.filter(ch => ch.name.toLowerCase().includes(input.toLowerCase()) && ch.type === ChannelType.GuildText).first();
                        if(channelFilter2){
                            channel = channelFilter2;
                        } else {
                            const channelFilter3 = interaction.guild.channels.cache.filter(ch => input.toLowerCase().includes(ch.name.toLowerCase()) && ch.type === ChannelType.GuildText).first();
                            if(channelFilter3){
                                channel = channelFilter3;
                            } else {
                                return interaction.reply({embeds: [channelNotFound], ephemeral: true}).catch(err => {});
                            }
                        }
                    }
                }

                const confirmChannel = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.embed["confirm-message"].title))
                .setDescription(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.embed["confirm-message"].message))
                .setTimestamp();

                const confirmBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId(`confirm-channel-embed-builder`)
                .setLabel(`Confirm`);
                const cancelBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId(`cancel-channel-embed-builder`)
                .setLabel(`Cancel`);

                const confirmActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

                client.interactionInfo.get(`ignore`).set(`confirm-channel-embed-builder`, true);
                client.interactionInfo.get(`ignore`).set(`cancel-channel-embed-builder`, true);

                return interaction.reply({embeds: [confirmChannel], components: [confirmActionRow], ephemeral: true, fetchReply: true}).then(msg => {
                    const filter = i => i.user.id === interaction.member.id;
                    const collector = msg.createMessageComponentCollector({filter, time: 20000, max: 1});
                    let stopped = false;
                    collector.on('collect', i => {
                        stopped = true;
                        collector.stop();
                        if(i.customId === `confirm-channel-embed-builder`){
                            client.interactionActions.delete(`embed-builder-${interaction.member.id}-${interaction.guild.id}`);
                            const embed = new EmbedBuilder()
                            .setColor(typeof embedObject['color'] === 'string' ? embedObject['color'] : client.embedColor);
                            if(typeof embedObject['title'] === 'string' || typeof embedObject['description'] === 'string'){
                                if(typeof embedObject['title'] === 'string') embed.setTitle(embedObject['title']);
                                if(typeof embedObject['description'] === 'string') embed.setDescription(embedObject['description']);
                            } else {
                                embed.setTitle(client.user.username);
                            }
                            if(typeof embedObject['author text'] === 'string'){
                                if(typeof embedObject['author image'] === 'string') embed.setAuthor({name: embedObject['author text'], iconURL: embedObject['author image']});
                                else embed.setAuthor({name: embedObject['author text']});
                            }
                            if(typeof embedObject['footer text'] === 'string'){
                                if(typeof embedObject['footer image'] === 'string') embed.setFooter({text: embedObject['footer text'], iconURL: embedObject['footer image']});
                                else embed.setFooter({text: embedObject['footer text']});
                            }
                            if(typeof embedObject['timestamp'] === 'number') embed.setTimestamp(embedObject['timestamp']);
                            if(typeof embedObject['thumbnail'] === 'string') embed.setThumbnail(embedObject['thumbnail']);
                            if(typeof embedObject['image'] === 'string') embed.setImage(embedObject['image']);
                            if(typeof embedObject['url'] === 'string') embed.setURL(embedObject['url']);

                            channel.send({embeds: [embed]}).then(async () => {
                                const success = new EmbedBuilder()
                                .setColor(client.embedColor)
                                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                                .setTitle(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.embed.success.title))
                                .setDescription(handleMessage(client, interaction.member.user, undefined, channel, messages.moderation.embed.success.message))
                                .setTimestamp();
                                await wait(400);
                                interaction.message.delete().catch(err => {});
                                await wait(400);
                                interaction.editReply({embeds: [success], components: [], ephemeral: true}).catch(err => {});
                            }).catch(async err => {
                                await wait(400);
                                interaction.reply({embeds: [unknownError], ephemeral: true}).catch(err => {});
                            });
                            return;
                        } else {
                            return msg.delete().catch(err => {});
                        }
                    });
                    collector.on('end', () => {
                        client.interactionInfo.get(`ignore`).delete(`confirm-channel-embed-builder`);
                        client.interactionInfo.get(`ignore`).delete(`cancel-channel-embed-builder`);
                        if(stopped === false) return msg.delete().catch(err => {});
                    });
                }).catch(err => {
                    console.log(`Interaction error: `,err);
                });
                break;
            default:
                embedObject[interactionType] = input;
                interaction.deferUpdate().catch(err => {});
                break;
        }
        client.interactionActions.set(`embed-builder-${interaction.member.id}-${interaction.guild.id}`, embedObject);

        const previewEmbed = new EmbedBuilder()
        .setColor(typeof embedObject['color'] === 'string' ? embedObject['color'] : client.embedColor);
        if(typeof embedObject['title'] === 'string' || typeof embedObject['description'] === 'string'){
            if(typeof embedObject['title'] === 'string') previewEmbed.setTitle(embedObject['title']);
            if(typeof embedObject['description'] === 'string') previewEmbed.setDescription(embedObject['description']);
        } else {
            previewEmbed.setTitle(client.user.username);
        }
        if(typeof embedObject['author text'] === 'string'){
            if(typeof embedObject['author image'] === 'string') previewEmbed.setAuthor({name: embedObject['author text'], iconURL: embedObject['author image']});
            else previewEmbed.setAuthor({name: embedObject['author text']});
        }
        if(typeof embedObject['footer text'] === 'string'){
            if(typeof embedObject['footer image'] === 'string') previewEmbed.setFooter({text: embedObject['footer text'], iconURL: embedObject['footer image']});
            else previewEmbed.setFooter({text: embedObject['footer text']});
        }
        if(typeof embedObject['timestamp'] === 'number') previewEmbed.setTimestamp(embedObject['timestamp']);
        if(typeof embedObject['thumbnail'] === 'string') previewEmbed.setThumbnail(embedObject['thumbnail']);
        if(typeof embedObject['image'] === 'string') previewEmbed.setImage(embedObject['image']);
        if(typeof embedObject['url'] === 'string') previewEmbed.setURL(embedObject['url']);

        await wait(400);

        interaction.message.edit({embeds: [previewEmbed]}).catch(err => {});
    }
}
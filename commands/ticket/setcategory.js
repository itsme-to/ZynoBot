const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, PermissionsBitField } = require('discord.js');
const messages = require('../../messages.json');
const messageHandler = require('../../handlers/handleMessages.js');
const { wait } = require('../../functions');

module.exports = {
    data: {
        name: 'set-category',
        description: 'Change the ticket category of a ticket',
        options: [],
        category: 'Tickets',
        defaultEnabled: false,
        visible: true,
        permissions: 'ManageMessages'
    },
    run: async function(client, args, message, interaction){
        const { data } = client.commands.get(args[0].toLowerCase());
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-set-category'].title))
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['error-messages']['no-permissions-set-category'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const noTicket = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands["error-messages"]["not-ticket"].title))
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands["error-messages"]["not-ticket"].message))
        .setTimestamp();

        const ticketFilter = client.tickets.filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(t => typeof t === 'string' ? t === message.channel.id : t.channel === message.channel.id && t.guild === message.guild.id).length > 0;
            } else if(typeof t.value === 'string'){
                return t.value === message.channel.id;
            } else {
                return false;
            }
        });
        
        if(ticketFilter.size === 0) return sendMessage({embeds: [noTicket]}).catch(err => {});

        const currentTicket = client.deepCopy(client.tickets.get(ticketFilter.firstKey())).filter(t => typeof t === 'string' ? t === message.channel.id : t.channel === message.channel.id && t.guild === message.guild.id)[0];

        if(!currentTicket) return sendMessage({embeds: [noTicket]}).catch(err => {});

        let creatorTicket = message.guild.members.cache.get(ticketFilter.firstKey());
        if(!creatorTicket){
            try{
                creatorTicket = await client.cache.getMember(ticketFilter.firstKey(), message.guild);
            } catch {}
        }
        if(!creatorTicket) creatorTicket = {displayName: 'Unknown'};

        const guildCategories = client.deepCopy(client.globals.get(`ticket-categories`) ?? {})[message.guild.id] ?? [];

        const noCategories = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands["error-messages"]['no-categories'].title))
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands["error-messages"]["no-categories"].message))
        .setTimestamp();

        if(guildCategories.length === 0) return sendMessage({embeds: [noCategories]}).catch(err => {});

        const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('set-ticket-category')
        .setPlaceholder('No category selected')
        .setOptions([...guildCategories.map(g => {
            return {
                label: g.name,
                description: 'Change the ticket category to '+g.name,
                value: g.name.toLowerCase().split(" ").join("-")
            }
        }), {
            label: 'Cancel',
            description: 'Cancel this action',
            value: 'cancel'
        }]);

        const categoryActionRow = new ActionRowBuilder().setComponents(selectMenu);

        const selectCategory = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['select-category'].title))
        .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['select-category'].message))
        .setTimestamp();

        async function updateStartMessage(msgId, content){
            if(typeof msgId === 'string'){
                message.channel.messages.fetch(msgId).then(async msg => {
                    await wait(400);
                    msg.edit(client.handleContent(msg, content)).catch(err => {});
                }).catch(err => {
                    if(client.config.debugger) console.log(err);
                });
                return true;
            } else {
                let ticketMessages = new Collection();
                try{
                    let fetchedTicketMessages = await message.channel.messages.fetch({after: 0, limit: 100});
                    fetchedTicketMessages.sort((a, b) => {
                        return a.id - b.id;
                    });
                    ticketMessages = ticketMessages.concat(fetchedTicketMessages);
                    await wait(400);
                    while(fetchedTicketMessages.size === 100){
                        fetchedTicketMessages = await message.channel.messages.fetch({limit: 100, after: fetchedTicketMessages.lastKey()});
                        fetchedTicketMessages.sort((a, b) => {
                            return a.id - b.id;
                        });
                        ticketMessages = ticketMessages.concat(fetchedTicketMessages);
                        await wait(400);
                    }
                } catch {}
                if(ticketMessages.size > 0){
                    const botMessages = ticketMessages.filter(m => m.author.id === client.user.id);
                    botMessages.sort((a, b) => {
                        return a.id - b.id;
                    });
                    const startMessage = botMessages.first();
                    startMessage.edit(client.handleContent(startMessage, content)).catch(err => {});
                }
            }
        }

        sendMessage({embeds: [selectCategory], components: [categoryActionRow]}).then(msg => {
            const collector = msg.createMessageComponentCollector({
                filter: i => i.member.id === message.member.id,
                max: 1,
                time: 3*6e4
            });

            collector.once('collect', async i => {
                i.deferUpdate().catch(err => {});
                await wait(4e2);
                const categoryVal = i.values[0];
                if(categoryVal === 'cancel') return msg.delete().catch(err => {});
                const selectedCategory = guildCategories.filter(c => c.name.toLowerCase().split(" ").join("-") === categoryVal)[0];
                if(!selectedCategory) return;

                const converting = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['converting-category'].title))
                .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['converting-category'].message, [{CATEGORY: selectedCategory.name}]))
                .setTimestamp();

                msg.edit({embeds: [converting], components: []}).catch(err => {});

                await wait(4e2);

                let categoryMessage = selectedCategory?.description ?? messages.tickets['ticket-messages'].category.message;

                const categoryEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets['ticket-messages'].category.title))
                .setDescription(messageHandler(client, message.member.user, undefined, message.channel, categoryMessage, [{CATEGORY: selectedCategory['name'], CLAIMED_USER: typeof currentTicket.claimed === 'string' ? `<@!${currentTicket.claimed}>` : messageHandler(client, message.member.user, undefined, message.channel, messages.tickets['ticket-not-claimed']), CREATOR_USER: `<@!${ticketFilter.firstKey()}>`, QUESTIONS: currentTicket.questions ?? ''}]))
                .setTimestamp();

                const closeBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets['close-button']))
                .setCustomId(`close-ticket`);

                const closeActionRowComponents = [closeBtn];

                if(client.config.tickets['claim-system'][message.guild.id] === true){
                    closeActionRowComponents.push(new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets['claim-button']))
                    .setCustomId(`claim-ticket`)
                    .setDisabled(typeof currentTicket.claimed === 'string' ? true : false),
                    new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets['unclaim-button']))
                    .setCustomId(`unclaim-ticket`)
                    .setDisabled(typeof currentTicket.claimed === 'string' ? false : true));
                }

                const closeActionRow = new ActionRowBuilder().addComponents(...closeActionRowComponents);

                if(typeof currentTicket.category === 'string'){
                    const currentCategory = guildCategories.filter(c => c.name.toLowerCase() === currentTicket.category.toLowerCase())[0];
                    if(currentCategory){
                        if(typeof currentCategory.role === 'string'){
                            try{
                                await message.channel.permissionOverwrites.delete(currentCategory.role, `Change of ticket category`);
                            } catch(err) {
                                if(client.config.debugger) console.log(err);
                            }
                            await wait(4e2);
                        }
                    }
                }

                try{
                    await updateStartMessage(currentTicket.message ?? undefined, {embeds: [categoryEmbed], components: [closeActionRow]});
                } catch(err) {
                    if(client.config.debugger) console.log(err);
                }
                await wait(4e2);

                let newChannelName = `${selectedCategory.name.toLowerCase().split(" ").join("-")}-${creatorTicket.displayName}`;
                let parentId = selectedCategory.parentId ?? (client.config.tickets.parent[message.guild.id] ?? undefined);

                try{
                    await message.channel.edit({
                        parent: parentId,
                        name: newChannelName
                    });
                } catch (err){
                    if(client.config.debugger) console.log(err);
                    console.log(err);
                }
                await wait(4e2);

                if(typeof selectedCategory.role === 'string'){
                    try{
                        await message.channel.permissionOverwrites.create(selectedCategory.role, {
                            SendMessages: true,
                            ViewChannel: true,
                            ReadMessageHistory: true
                        });
                    } catch (err){
                        if(client.config.debugger) console.log(err);
                    }
                    await wait(4e2);
                }

                currentTicket.category = selectedCategory.name;

                try{
                    await client.dbHandler.setValue(`tickets`, currentTicket, {memberId: ticketFilter.firstKey(), guildId: message.guild.id, channelId: message.channel.id});
                } catch {}

                const updated = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['converted-category'].title))
                .setDescription(messageHandler(client, message.member.user, undefined, message.channel, messages.tickets.commands['success-messages']['converted-category'].message, [{CATEGORY: selectedCategory.name}]))
                .setTimestamp();

                msg.edit({embeds: [updated], components: []}).catch(err => {});
            });

            collector.once('end', collected => {
                if(collected.size === 0) return msg.delete().catch(err => {});
            });
        }).catch(err => {
            if(client.config.debugger) console.log(err);
        });
    }
}
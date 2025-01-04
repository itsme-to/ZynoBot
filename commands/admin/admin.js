const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField, ModalBuilder, ButtonBuilder, TextInputBuilder, ButtonStyle, TextInputStyle, User, Team } = require('discord.js');
const configHandler = require('../../handlers/saveConfig.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

function firstLetterUppercase(string){
    var firstLetter = string.slice(0, 1);
    var newString = firstLetter.toUpperCase() + string.slice(1, string.length);
    return newString;
}

module.exports = {
    data: {
        name: 'admin',
        description: 'Admin commands (only slash command available)',
        category: 'Admin',
        options: [{type: 3, name: 'action', description: 'What the bot should do', choices: [{
            name: "Change the economy settings",
            value: 'economy'
        }, {
            name: 'Enable or disable a category',
            value: 'category'
        }, {
            name: 'Add or remove a special role',
            value: 'role',
        }, {
            name: 'Enable or disable a special channel',
            value: 'channel'
        }, {
            name: 'Enable, disable or change a filter',
            value: 'filter'
        }, {
            name: 'Create back-up',
            value: 'back-up'
        }, {
            name: 'Change the ticket settings',
            value: 'ticket-settings'
        }, {
            name: 'Change the level settings',
            value: 'level-settings'
        }, {
            name: 'Change the help embed',
            value: 'help-embed'
        }, {
            name: 'Change the embed settings',
            value: 'embeds'
        }, {
            name: 'Change game settings',
            value: 'games'
        }, {
            name: 'Change welcome/leave message type',
            value: 'wl-message'
        }, {
            name: 'Enable or disable verification system',
            value: 'verification'
        }, {
            name: 'Enable or disable autoreplies',
            value: 'autoreply'
        }, {
            name: 'Enable or disable message commands',
            value: 'message-commands'
        }, {
            name: 'Change suggestion settings',
            value: 'suggestion'
        }, {
            name: 'Move to different database',
            value: 'database'
        }], required: true}],
        permissions: 'Administrator',
        defaultEnabled: true,
        visible: true
    },
    run: function(client, args, message, interaction){
        const onlySlash = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['admin-commands'].onlySlash.title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['admin-commands'].onlySlash.message))
        .setTimestamp();

        if(interaction === false) return sendMessage({embeds: [onlySlash]}).catch(err => {});
        const { data } = client.commands.get(args[0].toLowerCase());

        function sendMessage(content){
            return new Promise((resolve, reject) => {
                if(interaction === false) message.channel.send(client.handleContent(message, content)).then(resolve).catch(reject);
                else {
                    var content_message = {...content};
                    content_message['ephemeral'] = true;
                    content_message['fetchReply'] = true;
                    message.reply(client.handleContent(message, content_message)).then(msg => {
                        resolve(msg);
                    }).catch(reject);
                }
            });
        }

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['admin-commands']['no-permissions'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['admin-commands']['no-permissions'].message, [{PERMISSIONS: data.permissions}]))
        .setTimestamp();

        if(!message.member.permissions.has(PermissionsBitField.Flags[data.permissions])) return sendMessage({embeds: [noPerms]}).catch(err => {});

        const ownerOnly = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Owner only`)
        .setDescription(`Only an owner of this bot can execute this command`)
        .setTimestamp();
        
        const option = message.options.getString(`action`);
        switch(option){
            case 'channel':
                const channelMenu = new StringSelectMenuBuilder()
                .setCustomId(`select-channel`)
                .setPlaceholder(`No channel selected...`)
                .setOptions([{
                    label: 'Welcome channel',
                    value: 'welcome-channel',
                    description: 'Enable or disable a channel where the welcome messages should be sent'
                }, {
                    label: 'Leave channel',
                    value: 'leave-channel',
                    description: 'Enable or disable a channel where the leave messages should be sent'
                }, {
                    label: 'Counting channel',
                    value: 'counting-channel',
                    description: 'Enable or disable a channel where you can play a counting mini-game'
                }, {
                    label: 'Snake channel',
                    value: 'snake-channel',
                    description: 'Enable or disable a channel where you can play a snake mini-game'
                }, {
                    label: 'Level channel',
                    value: 'level-channel',
                    description: 'The channel where the level up messages should be sent in'
                }, {
                    label: 'Logs channel',
                    value: 'logs-channel',
                    description: 'Where the log messages should be sent in'
                }, {
                    label: 'Suggestion channel',
                    value: 'suggestion-channel',
                    description: 'The channel where the suggestion should be sent in'
                }, {
                    label: 'Ticket category',
                    value: 'ticket-category',
                    description: 'In which category the tickets should be placed'
                }, {
                    label: 'Anti-filter channel',
                    value: 'filter-channel',
                    description: "Add (max 10) or remove a channel where the filters won't work"
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this option'
                }]);
                const channelActionRow = new ActionRowBuilder().addComponents(channelMenu);
                const selectChannel = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(`Select a channel type`)
                .setDescription(`Please select a channel type in the select menu below`)
                .setTimestamp();

                sendMessage({embeds: [selectChannel], components: [channelActionRow]}).catch(err => {});
                break;
            case 'category':
                if(message.member.id !== client.application.ownerId){
                    if(client.application.owner instanceof User){
                        if(client.application.owner.id !== message.member.id){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else if(client.application.owner instanceof Team) {
                        if(!client.application.owner.members.get(message.member.id)){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else {
                        return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                    }
                }
                const categories = client.config.categories.reduce((arr, __category) => {
                    const { category } = __category;
                    if(typeof client.config[category] === 'boolean'){
                        arr.push({
                            label: firstLetterUppercase(category),
                            value: category,
                            description: `${Boolean(client.config[category]) === true ? `Disable` : `Enable`} the ${category.toLowerCase()} category`
                        });
                    } else if(typeof client.config[category] === 'object'){
                        if(typeof client.config[category].enabled === 'boolean'){
                            arr.push({
                                label: firstLetterUppercase(category),
                                value: category,
                                description: `${Boolean(client.config[category].enabled) === true ? `Disable` : `Enable`} the ${category.toLowerCase()} category`
                            });
                        }
                    }
                    return arr;
                }, []);
                categories.push({
                    label: `Cancel`,
                    value: 'cancel',
                    description: 'Cancel this action'
                });
                const categoryMenu = new StringSelectMenuBuilder()
                .setCustomId(`select-category`)
                .setPlaceholder(`No category selected`)
                .setOptions(categories);
                const categoryActionRow = new ActionRowBuilder().addComponents(categoryMenu);
                const categoryEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(`Select a category`)
                .setDescription(`Please select a category in the select menu below to enable or disable it`)
                .setTimestamp();

                sendMessage({embeds: [categoryEmbed], components: [categoryActionRow]}).catch(err => {});
                break;
            case 'economy':
                const selectEconomySetting = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Change the economy settings')
                .setDescription('Please select in the select menu below what you would like to change from the economy settings.')
                .setTimestamp();

                const economySettings = new StringSelectMenuBuilder()
                .setCustomId('select-economy-settings-action')
                .setPlaceholder('No option selected')
                .setOptions([{
                    label: 'Change someone\'s economy balance',
                    value: 'balance',
                    description: 'Change the balance someone has in the economy system'
                }, {
                    label: 'Manage voice channel coins',
                    value: 'vccoins',
                    description: 'Enable, disable or change voice channel coins'
                }, {
                    label: 'Manage shop items',
                    value: 'shop',
                    description: 'Add, remove or change shop items'
                }, {
                    label: 'Change someone\'s inventory',
                    value: 'inventory',
                    description: 'Change the items someone has in the economy system'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const economyActionRow = new ActionRowBuilder().addComponents(economySettings);

                sendMessage({embeds: [selectEconomySetting], components: [economyActionRow]}).catch(err => {});
                break;
            case 'role':
                const roleSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`role-select-admin`)
                .setPlaceholder(`No role type selected`)
                .setOptions([{
                    label: 'Join role',
                    value: 'join',
                    description: 'Add or remove a role which a member will get whenever a member joins the server'
                }, {
                    label: 'Moderator role',
                    value: 'moderator',
                    description: 'Add or remove a role as a moderator role'
                }, {
                    label: 'Ticket role',
                    value: 'ticket',
                    description: 'Add or remove a role to be added in a ticket'
                }, {
                    label: 'Anti-filter role',
                    value: 'anti-filter',
                    description: 'Add or remove a role to be ignored for filters'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);
                const roleEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(`Select a role type`)
                .setDescription(`Please select a role type to add or remove one`)
                .setTimestamp();

                const roleActionRow = new ActionRowBuilder().addComponents(roleSelectMenu);

                sendMessage({embeds: [roleEmbed], components: [roleActionRow]}).catch(err => {});
                break;
            case 'filter':
                const filterSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`filter-select-admin`)
                .setPlaceholder(`No filter selected`)
                .setOptions([{
                    label: 'Invite filter',
                    value: 'invite',
                    description: `${client.config.filters.invite[message.guild.id] === true ? `Disable` : `Enable`} the anti-invite filter`
                }, {
                    label: 'Link filter',
                    value: 'links',
                    description: `${client.config.filters.links[message.guild.id] === true ? `Disable` : `Enable`} the anti-link filter`
                }, {
                    label: 'Bad word filter',
                    value: 'badword',
                    description: `${client.config.filters.badword[message.guild.id] === true ? `Disable or change` : `Enable`} the bad word filter`
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);
                const filterEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                .setTitle(`Select a filter`)
                .setDescription(`Please select a filter to enable, disable or change it`)
                .setTimestamp();

                const filterActionRow = new ActionRowBuilder().addComponents(filterSelectMenu);

                sendMessage({embeds: [filterEmbed], components: [filterActionRow]}).catch(err => {});
                break;
            case 'back-up':
                if(message.member.id !== client.application.ownerId){
                    if(client.application.owner instanceof User){
                        if(client.application.owner.id !== message.member.id){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else if(client.application.owner instanceof Team) {
                        if(!client.application.owner.members.get(message.member.id)){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else {
                        return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                    }
                }
                const confirmEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Confirm your action`)
                .setDescription(`Are you sure that you want to create a back-up of Zyno Bot? The back-up will take up space on your disk space. This action can not be aborted during the process.`)
                .setTimestamp();

                const confirmBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setLabel(`Confirm`)
                .setCustomId(`confirm-back-up`);
                const cancelBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel(`Cancel`)
                .setCustomId(`cancel-back-up`);

                const backUpActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

                sendMessage({embeds: [confirmEmbed], components: [backUpActionRow]}).catch(err => {});
                break;
            case 'ticket-settings':
                const ticketSettingsEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select an action`)
                .setDescription(`Please select an action from the select menu below.`)
                .setTimestamp();

                const ticketSettingsSelect = new StringSelectMenuBuilder()
                .setCustomId('select-ticket-setting')
                .setPlaceholder('No action selected')
                .setOptions([{
                    label: 'Ticket category',
                    value: 'ticket-category',
                    description: 'Add or remove a ticket category'
                }, {
                    label: 'Ticket amount',
                    value: 'tickets-amount',
                    description: 'Change the max amount of open tickets per member'
                }, {
                    label: 'Ticket category type',
                    value: 'ticket-category-type',
                    description: 'Change the ticket category type'
                }, {
                    label: 'DM transcript',
                    value: 'ticket-transcript-dm',
                    description: `${client.config.tickets.dm[message.guild.id] ? `Disable` : `Enable`} sending users their ticket transcript`
                }, {
                    label: 'Claim system',
                    value: 'ticket-claim-system',
                    description: `${client.config.tickets['claim-system'][message.guild.id] ? `Disable` : `Enable`} the ticket claim system`
                }, {
                    label: 'Instant category',
                    value: 'instant-category',
                    description: `${client.config.tickets['instant-category'][message.guild.id] ? `Allow members to instantly select a category when creating a ticket` : `Create a ticket channel first where members have to select the ticket category`}`
                }, {
                    label: 'Tag support',
                    value: 'tag-support',
                    description: `${client.config.tickets['tag-support'][message.guild.id] ? `Disable support roles being tagged when a ticket has been opened` : `Tag the roles of the support team after a ticket has been opened`}`
                }, {
                    label: 'Manage questions',
                    value: 'ticket-questions',
                    description: 'Add or remove questions for a specific ticket category'
                }, {
                    label: 'Auto tag',
                    value: 'auto-tag',
                    description: 'Enable or disable the auto tag feature'
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const ticketSettingsActionRow = new ActionRowBuilder().addComponents(ticketSettingsSelect);

                sendMessage({embeds: [ticketSettingsEmbed], components: [ticketSettingsActionRow]}).catch(err => {});
                break;
            case 'level-settings':
                const levelSettingsEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select an action`)
                .setDescription(`Please select an action from the select menu below.`)
                .setTimestamp();

                const levelSettingsSelect = new StringSelectMenuBuilder()
                .setCustomId('select-level-setting')
                .setPlaceholder('No action selected')
                .setOptions([{
                    label: 'Change someone\'s XP',
                    value: 'user-xp-change',
                    description: 'Change the amount of XP someone has'
                }, {
                    label: 'Change someone\'s level',
                    value: 'user-level-change',
                    description: 'Change the level someone has'
                }, {
                    label: 'Level roles',
                    value: 'level-roles',
                    description: 'Add or remove the level roles'
                }, {
                    label: 'Change level difficulty',
                    value: 'level-difficulty',
                    description: 'Change how hard it is to go level up'
                }, {
                    label: 'Change level image',
                    value: 'level-image',
                    description: `Change the level image to the ${client.config.level['canvas-type'][message.guild.id] === "CLASSIC" ? "modern" : "classic"} type`
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const levelSettingsActionRow = new ActionRowBuilder().addComponents(levelSettingsSelect);

                sendMessage({embeds: [levelSettingsEmbed], components: [levelSettingsActionRow]}).catch(err => {});
                break;
            case 'help-embed':
                if(message.member.id !== client.application.ownerId){
                    if(client.application.owner instanceof User){
                        if(client.application.owner.id !== message.member.id){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else if(client.application.owner instanceof Team) {
                        if(!client.application.owner.members.get(message.member.id)){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else {
                        return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                    }
                }
                const actionType = new StringSelectMenuBuilder()
                .setCustomId(`help-select-action`)
                .setPlaceholder(`Select an action to perform`)
                .setOptions([{
                    label: `${client.config.helpEmbedOnTag === true ? `Disable` : `Enable`} tag response`,
                    value: 'tag',
                    description: `${client.config.helpEmbedOnTag === true ? `Disable` : `Enable`} that the bot respons with the help embed on a tag`
                }, {
                    label: `${client.config.helpEmbedFull === true ? `Disable` : `Enable`} the full help embed`,
                    value: 'full',
                    description: `${client.config.helpEmbedOnTag === true ? `Disable` : `Enable`} showing the full help embed`
                }, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this option'
                }]);

                const helpActionRow = new ActionRowBuilder().addComponents(actionType);

                const helpEmbedSelection = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select help action`)
                .setDescription(`Select an action from the select menu below to perform`)
                .setTimestamp();

                sendMessage({embeds: [helpEmbedSelection], components: [helpActionRow]}).catch(err => {});
                break;
            case 'embeds':
                if(message.member.id !== client.application.ownerId){
                    if(client.application.owner instanceof User){
                        if(client.application.owner.id !== message.member.id){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else if(client.application.owner instanceof Team) {
                        if(!client.application.owner.members.get(message.member.id)){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else {
                        return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                    }
                }
                const embedSettingsMenu = new StringSelectMenuBuilder()
                .setCustomId(`embed-settings-action`)
                .setPlaceholder(`No action selected`)
                .setOptions([{
                    label: 'Color',
                    description: 'Change the embed color',
                    value: 'color'
                }, {
                    label: 'Author',
                    description: 'Change the author on the top of the embeds',
                    value: 'author'
                }, {
                    label: 'Footer',
                    description: 'Change the footer on the embeds',
                    value: 'footer'
                }, {
                    label: 'Timestamp',
                    description: `${client.config.embeds.timestamp === true ? `Remove` : `Add`} the timestamps on the embeds`,
                    value: 'timestamp'
                }, {
                    label: 'Cancel',
                    description: 'Cancel this action',
                    value: 'cancel'
                }]);
                const embedSettingsActionRow = new ActionRowBuilder().addComponents(embedSettingsMenu);

                const embedSettingsEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Change the embed settings`)
                .setDescription(`Please select an action in the select menu below to perform the action`)
                .setTimestamp();

                sendMessage({embeds: [embedSettingsEmbed], components: [embedSettingsActionRow]}).catch(err => {});
                break;
            case 'games':
                const gameActions = new StringSelectMenuBuilder()
                .setCustomId('game-settings-action')
                .setPlaceholder(`No action selected`)
                .setOptions([{
                    label: 'Minecraft',
                    description: 'Change the Minecraft settings',
                    value: 'minecraft'
                }, {
                    label: 'FiveM',
                    description: 'Change the FiveM settings',
                    value: 'fivem'
                }, {
                    label: 'Cancel',
                    description: 'Cancel this action',
                    value: 'cancel'
                }]);

                const gameSettingsActionRow = new ActionRowBuilder().addComponents(gameActions);

                const embedGameActions = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Change the game settings`)
                .setDescription(`Please select an action in the select menu below to perform the action`)
                .setTimestamp();

                sendMessage({embeds: [embedGameActions], components: [gameSettingsActionRow]}).catch(err => {});
                break;
            case 'wl-message':
                const actionWLMessageSelect = new StringSelectMenuBuilder()
                .setCustomId(`wl-message-select-action`)
                .setPlaceholder(`No action selected`)
                .setOptions([{
                    label: 'Welcome message',
                    description: `Change the welcome message`,
                    value: `welcome`
                }, {
                    label: 'Leave message',
                    description: `Change the leave message`,
                    value: `leave`
                }, {
                    label: 'Cancel',
                    description: 'Cancel this action',
                    value: `cancel`
                }]);

                const wlActionRowBuilder = new ActionRowBuilder().addComponents(actionWLMessageSelect);

                const selectWLEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Change welcome/leave message`)
                .setDescription(`Please select an action in the select menu below to perform the action`)
                .setTimestamp();

                sendMessage({embeds: [selectWLEmbed], components: [wlActionRowBuilder]}).catch(err => {});
                break;
            case 'verification':
                const changedVerification = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Enable or disable verification system`)
                .setDescription(`Please select an action in the select menu below to perform the action`)
                .setTimestamp();

                var verificationOptions = [];
                var verificationChannel = {
                    label: 'Channel',
                    description: 'Enable the channel verification',
                    value: 'channel'
                };
                var verificationDM = {
                    label: 'DM',
                    description: 'Enable the DM verification',
                    value: 'dm'
                };
                var verificationButton = {
                    label: 'Button',
                    description: 'Enable the button verification',
                    value: 'button'
                };
                var verificationDisable = {
                    label: 'Disable',
                    description: 'Disable the verification system',
                    value: 'disable'
                };
                var verificationCancel = {
                    label: 'Cancel',
                    description: 'Cancel this option',
                    value: 'cancel'
                };
                if(client.config.verificationType[message.guild.id] === false){
                    verificationOptions.push(verificationChannel, verificationDM, verificationButton, verificationCancel);
                } else if(client.config.verificationType[message.guild.id] === "DM"){
                    verificationOptions.push(verificationChannel, verificationButton, verificationDisable, verificationCancel);
                } else if(client.config.verificationType[message.guild.id] === "CHANNEL"){
                    verificationOptions.push(verificationDM, verificationButton, verificationDisable, verificationCancel);
                } else if(client.config.verificationType[message.guild.id] === "BUTTON"){
                    verificationOptions.push(verificationChannel, verificationDM, verificationDisable, verificationCancel);
                }

                const selectActionVerification = new StringSelectMenuBuilder()
                .setCustomId(`verification-select-action`)
                .setPlaceholder(`No action selected`)
                .setOptions(verificationOptions);

                const verificationActionRow = new ActionRowBuilder().addComponents(selectActionVerification);

                sendMessage({embeds: [changedVerification], components: [verificationActionRow]}).catch(err => {});
                break;
            case 'autoreply':
                const autoReply = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Enable or disable autoreply`)
                .setDescription(`Please select an action in the select menu below to perform the action`)
                .setTimestamp();

                const selectActionAutoReply = new StringSelectMenuBuilder()
                .setCustomId(`autoreply-select-action`)
                .setPlaceholder(`No action selected`)
                .setOptions([{
                    label: `Command`,
                    description: `${client.config.autoreply.command[message.guild.id] === true ? `Disable` : `Enable`} the command autoreply`,
                    value: `command`
                }, {
                    label: `Song`,
                    description: `${client.config.autoreply.song[message.guild.id] === true ? `Disable` : `Enable`} the song autoreply`,
                    value: `song`
                }, {
                    label: `Cancel`,
                    description: `Cancel this action`,
                    value: `cancel`
                }]);

                const autoreplyActionRow = new ActionRowBuilder().addComponents(selectActionAutoReply);

                sendMessage({embeds: [autoReply], components: [autoreplyActionRow]}).catch(err => {});
                break;
            case 'message-commands':
                if(message.member.id !== client.application.ownerId){
                    if(client.application.owner instanceof User){
                        if(client.application.owner.id !== message.member.id){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else if(client.application.owner instanceof Team) {
                        if(!client.application.owner.members.get(message.member.id)){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else {
                        return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                    }
                }

                client.config['message-commands'] = !client.config['message-commands'];
                configHandler(client, client.config);

                const changed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                .setTitle(`Message commands ${client.config['message-commands'] ? 'enabled' : 'disabled'}`)
                .setDescription(`The message commands have successfully been ${client.config['message-commands'] ? 'enabled' : 'disabled'}`)
                .setTimestamp();

                sendMessage({embeds: [changed]}).catch(err => {});
                break;
            case 'suggestion':
                const changeSuggestionSettings = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Change suggestion settings')
                .setDescription('Please select in the select menu below which setting you would like to change.')
                .setTimestamp();

                const suggestionSettings = new StringSelectMenuBuilder()
                .setCustomId('change-suggestion-settings')
                .setPlaceholder('No option selected')
                .setOptions([{
                    label: 'Suggestion conversion',
                    description: `${client.config.suggestion[message.guild.id].conversion ? `Disable` : `Enable`} messages inside the suggestion channel to be automatically converted to suggestions`,
                    value: 'conversion'
                }, {
                    label: 'Auto thread',
                    description: `${client.config.suggestion[message.guild.id].autoThread ? `Disable` : `Enable`} the bot to automatically start a thread for each suggestion`,
                    value: 'autothread'
                }, {
                    label: 'Cancel',
                    description: 'Cancel this action',
                    value: 'cancel'
                }]);

                const suggestionActionRow = new ActionRowBuilder().addComponents(suggestionSettings);

                sendMessage({embeds: [changeSuggestionSettings], components: [suggestionActionRow]}).catch(err => {});
                break;
            case 'database':
                if(message.member.id !== client.application.ownerId){
                    if(client.application.owner instanceof User){
                        if(client.application.owner.id !== message.member.id){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else if(client.application.owner instanceof Team) {
                        if(!client.application.owner.members.get(message.member.id)){
                            return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                        }
                    } else {
                        return sendMessage({embeds: [ownerOnly]}).catch(err => {});
                    }
                }

                const switchDB = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Change the database type')
                .setDescription(`Select in the select menu below to which database you'd like to change the database of the bot to.`)
                .setTimestamp();

                const dbSelectMenu = new StringSelectMenuBuilder()
                .setOptions([{
                    label: `MySQL${client.config.database.type.toLowerCase() === "mysql" ? " (current database)" : ""}`,
                    description: `Save any values of the bot in a MySQL database`,
                    value: 'mysql'
                }, {
                    label: `ValueSaver${client.config.database.type.toLowerCase() === "valuesaver" ? " (current database)" : ""}`,
                    description: `Save any values of the bot locally in the storage using ValueSaver`,
                    value: 'valuesaver'
                }, {
                    label: 'Cancel',
                    description: 'Cancel this option',
                    value: 'cancel'
                }])
                .setPlaceholder('No database type selected')
                .setCustomId('change-db-type');

                const dbActionRow = new ActionRowBuilder().addComponents(dbSelectMenu);

                sendMessage({embeds: [switchDB], components: [dbActionRow]}).catch(err => {});
                break;
        }
    }
}
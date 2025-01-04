const { EmbedBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalBuilder, StringSelectMenuBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'embed-settings-action',
        description: 'Once the an option in the select menu of the embed settings gets selected'
    },
    run: function(client, interaction){
        const val = interaction.values[0].toLowerCase();
        
        switch(val){
            case 'color':
                const inputHex = new TextInputBuilder()
                .setCustomId(`color-input`)
                .setMinLength(6)
                .setMaxLength(7)
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(`No color given`)
                .setLabel(`Provide the HEX color code`);

                const colorActionRow = new ActionRowBuilder().addComponents(inputHex);

                const colorModal = new ModalBuilder()
                .setCustomId(`change-embed-color`)
                .setTitle(`Provide the new embed color`)
                .setComponents(colorActionRow);

                interaction.showModal(colorModal).catch(err => {});
                break;
            case 'timestamp':
                client.config.embeds.timestamp = !client.config.embeds.timestamp;
                configHandler(client, client.config);

                const changed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Timestamp ${client.config.embeds.timestamp === true ? `enabled` : `disabled`}`)
                .setDescription(`The timestamps ${client.config.embeds.timestamp === true ? `will now show on the embeds` : `won't be shown on the embeds anymore`}`)
                .setTimestamp();

                interaction.update({embeds: [changed], components: []}).catch(err => {});
                break;
            case 'footer':
                const inputFooter = new TextInputBuilder()
                .setCustomId(`footer-input`)
                .setMinLength(0)
                .setMaxLength(20)
                .setRequired(false)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(`No text provided`)
                .setLabel(`Provide the new footer text`);

                const footerActionRow = new ActionRowBuilder().addComponents(inputFooter);

                const footerModal = new ModalBuilder()
                .setCustomId(`change-footer-text`)
                .setTitle(`Provide the new footer text`)
                .setComponents(footerActionRow);

                interaction.showModal(footerModal).catch(err => {});
                break;
            case 'author':
                var authorOptions;
                if(client.config.embeds.author.toUpperCase() === "DEFAULT"){
                    authorOptions = [{
                        label: 'Executor',
                        description: 'The author on the embeds will be the executor of the command',
                        value: 'executor'
                    }, {
                        label: 'Disable',
                        description: 'Disable the author on the embeds',
                        value: 'none'
                    }];
                } else if(client.config.embeds.author.toUpperCase() === "EXECUTOR"){
                    authorOptions = [{
                        label: 'Bot',
                        description: "The author on the embeds will be the bot's avatar and username",
                        value: 'default'
                    }, {
                        label: 'Disable',
                        description: 'Disable the author on the embeds',
                        value: 'none'
                    }];
                } else if(client.config.embeds.author.toUpperCase() === "NONE"){
                    authorOptions = [{
                        label: 'Bot',
                        description: "The author on the embeds will be the bot's avatar and username",
                        value: 'default'
                    }, {
                        label: 'Executor',
                        description: 'The author on the embeds will be the executor of the command',
                        value: 'executor'
                    }];
                }
                authorOptions.push({
                    label: 'Cancel',
                    description: 'Cancel this action',
                    value: 'cancel'
                });

                const authorSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`change-author-embed-type`)
                .setPlaceholder(`No option selected`)
                .setOptions(authorOptions);

                const authorActionRow = new ActionRowBuilder().addComponents(authorSelectMenu);
                
                const authorEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Change the author type`)
                .setDescription(`Select one of the options below to change the author type on the embeds`)
                .setTimestamp();

                interaction.update({embeds: [authorEmbed], components: [authorActionRow]}).catch(err => {});
                break;
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the embed has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
        }
    }
}
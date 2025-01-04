const { EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'verification-select-action',
        description: 'When the verification type gets changed'
    },
    run: async function(client, interaction){
        const value = interaction.values[0].toLowerCase();

        switch(value){
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the verification system has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            case 'disable':
                if(client.config.verificationType[interaction.guild.id] === "CHANNEL" || client.config.verificationType[interaction.guild.id] === "BUTTON"){
                    const verificationChannel = client.deepCopy((client.globals.get(`verification-channel`) ?? {}));
                    delete verificationChannel[interaction.guild.id];
                    try{
                        await client.dbHandler.setValue(`globals`, verificationChannel, {'globalsKey': 'verification-channel'});
                    } catch {}
                }
                client.config.verificationType[interaction.guild.id] = false;
                configHandler(client, client.config);

                const disabled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Disabled verification`)
                .setDescription(`The verification system has successfully been disabled`)
                .setTimestamp();

                interaction.update({embeds: [disabled], components: []}).catch(err => {});
                break;
            case 'dm':
                if(client.config.verificationType[interaction.guild.id] === "CHANNEL" || client.config.verificationType[interaction.guild.id] === "BUTTON"){
                    let currentVerificationChannels = client.deepCopy((client.globals.get(`verification-channel`) || {}));
                    delete currentVerificationChannels[interaction.guild.id];
                    try{
                        await client.dbHandler.setValue('globals', currentVerificationChannels, {'globalsKey': 'verification-channel'});
                    } catch {}
                }
                client.config.verificationType[interaction.guild.id] = "DM";
                configHandler(client, client.config);

                const setDM = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Verification system changed`)
                .setDescription(`The verification system has successfully been set to the DM verification`)
                .setTimestamp();

                interaction.update({embeds: [setDM], components: []}).catch(err => {});
                break;
            case 'channel':
                const channelInput = new TextInputBuilder()
                .setCustomId(`channel`)
                .setMinLength(1)
                .setMaxLength(100)
                .setRequired(true)
                .setLabel(`The name or id of the verification channel`)
                .setPlaceholder(`No channel provided`)
                .setStyle(TextInputStyle.Short);

                const channelActionRow = new ActionRowBuilder().addComponents(channelInput);

                const channelModal = new ModalBuilder()
                .setCustomId(`verification-channel__channel`)
                .setTitle(`Channel name or id`)
                .setComponents(channelActionRow);

                interaction.showModal(channelModal).catch(err => {});
                break;
            case 'button':
                const channelInputBtn = new TextInputBuilder()
                .setCustomId(`channel`)
                .setMinLength(1)
                .setMaxLength(100)
                .setRequired(true)
                .setLabel(`The name or id of the verification channel`)
                .setPlaceholder(`No channel provided`)
                .setStyle(TextInputStyle.Short);

                const channelActionRowBtn = new ActionRowBuilder().addComponents(channelInputBtn);

                const channelModalBtn = new ModalBuilder()
                .setCustomId(`verification-channel__button`)
                .setTitle(`Channel name or id`)
                .setComponents(channelActionRowBtn);

                interaction.showModal(channelModalBtn).catch(err => {});
                break;
        }
    }
}
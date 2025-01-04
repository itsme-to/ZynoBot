const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'wl-message-select-action',
        description: 'When the user wants to perform a welcome/leave message action'
    },
    run: function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        switch(type){
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the welcome or leave message has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            case 'welcome':

                const changeWelcome = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Change the welcome message`)
                .setDescription(`Select one of the options below to change the welcome message`)
                .setTimestamp();

                const welcomeMessageTypes = new StringSelectMenuBuilder()
                .setPlaceholder('No option selected')
                .setCustomId('welcome-message-change-type')
                .setOptions([{
                    label: `Image ${client.config.welcome.type === "IMAGE" ? "(Enabled)" : ""}`,
                    description: 'Change the welcome message to an image',
                    value: 'image'
                }, {
                    label: `Embed ${client.config.welcome.type === "EMBED" ? "(Enabled)" : ""}`,
                    description: 'Change the welcome message to an embed',
                    value: 'embed'
                }, {
                    label: `Message ${client.config.welcome.type === "MESSAGE" ? "(Enabled)" : ""}`,
                    description: 'Change the welcome message to a text message',
                    value: 'message'
                }, {
                    label: `Cancel`,
                    description: 'Cancel this action',
                    value: 'cancel'
                }]);

                const welcomeMessageTypeActionRow = new ActionRowBuilder()
                .setComponents(welcomeMessageTypes);

                interaction.update({embeds: [changeWelcome], components: [welcomeMessageTypeActionRow]}).catch(err => {});
                break;
            case 'leave':

                const changeLeave = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Change the leave message`)
                .setDescription(`Select one of the options below to change the leave message`)
                .setTimestamp();

                const leaveMessageTypes = new StringSelectMenuBuilder()
                .setPlaceholder('No option selected')
                .setCustomId('leave-message-change-type')
                .setOptions([{
                    label: `Image ${client.config.leave.type === "IMAGE" ? "(Enabled)" : ""}`,
                    description: 'Change the leave message to an image',
                    value: 'image'
                }, {
                    label: `Embed ${client.config.leave.type === "EMBED" ? "(Enabled)" : ""}`,
                    description: 'Change the leave message to an embed',
                    value: 'embed'
                }, {
                    label: `Message ${client.config.leave.type === "MESSAGE" ? "(Enabled)" : ""}`,
                    description: 'Change the leave message to a text message',
                    value: 'message'
                }, {
                    label: `Cancel`,
                    description: 'Cancel this action',
                    value: 'cancel'
                }]);

                const leaveMessageTypesActionRow = new ActionRowBuilder()
                .setComponents(leaveMessageTypes);

                interaction.update({embeds: [changeLeave], components: [leaveMessageTypesActionRow]}).catch(err => {});
                break;
        }
    }
}
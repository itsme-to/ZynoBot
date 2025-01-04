const { EmbedBuilder } = require("discord.js");
const handleMessage = require("../handlers/handleMessages.js");
const messages = require("../messages.json");
const { wait } = require("../functions");

module.exports = {
    data: {
        id: 'react_role',
        description: 'When a member presses a reaction role button'
    },
    run: async function(client, interaction){
        let getData = client.reactrole.get(interaction.message.id);
        if(!getData) return;
        getData = client.deepCopy(getData);

        var data;
        if(interaction.isButton()){
            data = getData.filter(r => r.button_id === interaction.customId && r.channel === interaction.channel.id)[0];
            if(!data) return interaction.deferUpdate().catch(err => {});
        } else if(interaction.isStringSelectMenu()){
            data = getData.filter(r => {
                if(r.selectMenuOpt !== null){
                    return r.selectMenuOpt.value === interaction.values[0].toLowerCase() && r.channel === interaction.channel.id;
                } else {
                    return false;
                }
            })[0];
            if(!data) return interaction.deferUpdate().catch(err => {});
        } else {
            return interaction.deferUpdate().catch(err => {});
        }
        interaction.deferReply({ephemeral: true}).catch(err => {});

        await wait(300);

        const errorEmbed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.react.actions["confirmation-messages"]["error"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.react.actions["confirmation-messages"]["error"].message))
        .setTimestamp();

        if(interaction.member.roles.cache.get(data.role)){
            const removeEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.react.actions["confirmation-messages"]["role-removed"].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.react.actions["confirmation-messages"]["role-removed"].message))
            .setTimestamp();

            interaction.member.roles.remove(data.role).then(async () => {
                await wait(400);
                interaction.editReply({embeds: [removeEmbed]}).catch(console.log);
            }).catch(async err => {
                await wait(400);
                interaction.editReply({embeds: [errorEmbed]}).catch(console.log);
            });
        } else {                
            const addedEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.react.actions["confirmation-messages"]["role-added"].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.react.actions["confirmation-messages"]["role-added"].message))
            .setTimestamp();

            interaction.member.roles.add(data.role).then(async () => {
                await wait(400);
                interaction.editReply({embeds: [addedEmbed]}).catch(console.log);
            }).catch(async err => {
                await wait(400);
                interaction.editReply({embeds: [errorEmbed]}).catch(console.log);
            });
        }
    }
}
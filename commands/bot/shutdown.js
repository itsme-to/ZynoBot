const { EmbedBuilder, Team, User, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'shutdown',
        description: 'Shut the bot down',
        category: 'Bot',
        options: [],
        defaultEnabled: true,
        permissions: 'Administrator',
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-shutdown'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-shutdown'].message, [{PERMISSIONS: 'Owner'}]))
        .setTimestamp();

        if(message.member.id !== client.application.ownerId){
            if(client.application.owner instanceof User){
                if(client.application.owner.id !== message.member.id){
                    return sendMessage({embeds: [noPerms]}).catch(err => {});
                }
            } else if(client.application.owner instanceof Team) {
                if(!client.application.owner.members.get(message.member.id)){
                    return sendMessage({embeds: [noPerms]}).catch(err => {});
                }
            } else {
                return sendMessage({embeds: [noPerms]}).catch(err => {});
            }
        }

        const shutdown = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['confirm-messages']['shutdown'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['confirm-messages']['shutdown'].message))
        .setTimestamp();
        const confirmBtn = new ButtonBuilder()
        .setCustomId('confirm-shutdown')
        .setStyle(ButtonStyle.Danger)
        .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['confirm-messages']['shutdown']['confirm-button']));
        const cancelBtn = new ButtonBuilder()
        .setCustomId('cancel-shutdown')
        .setStyle(ButtonStyle.Secondary)
        .setLabel(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['confirm-messages']['shutdown']['cancel-button']));
        const actionRow = new ActionRowBuilder()
        .addComponents([confirmBtn, cancelBtn]);

        sendMessage({embeds: [shutdown], components: [actionRow]}).then(msg => {
            client.interactionInfo.get(`ignore`).set(msg.id, true);
            const filter = i => (i.customId === 'confirm-shutdown' || i.customId === 'cancel-shutdown') && i.user.id === message.member.id;
            const collector = msg.createMessageComponentCollector({filter: filter, max: 1, time: 15000});
            collector.on('collect', i => {
                if(i.customId === 'confirm-shutdown'){
                    const shuttingDown = new EmbedBuilder()
                    .setColor(client.embedColor)
                    .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
                    .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['shutdown'].title))
                    .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['shutdown'].message))
                    .setTimestamp();

                    msg.edit(client.handleContent(message, {embeds: [shuttingDown], components: []})).then(() => {
                        console.log(`Shutting down in order of ${message.member.user.username}`);
                        setTimeout(function(){
                            client.destroy();
                            process.exit();
                        }, 2000);
                    }).catch(err => {});
                } else {
                    msg.delete().catch(err => {});
                }
            })
            collector.on('end', () => {
                client.interactionInfo.get(`ignore`).delete(msg.id);
                if(collector.collected.size === 0) return msg.delete().catch(err => {});
            });
        }).catch(err => {});
    }
}
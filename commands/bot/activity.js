const { EmbedBuilder, Team, User, ActivityType } = require('discord.js');
const configHandler = require('../../handlers/saveConfig.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');

module.exports = {
    data: {
        name: 'activity',
        description: 'Change the activity of the bot',
        category: 'Bot',
        options: [{type: 3, name: 'activity', description: 'The new activity of the bot', required: true}],
        defaultEnabled: true,
        permissions: 'Administrator',
        visible: true
    },
    run: function(client, args, message, interaction){
        const sendMessage = client.sendMessage(message, interaction);

        const noPerms = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-activity'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-permissions-activity'].message, [{PERMISSIONS: 'Owner'}]))
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

        const noActivity = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-activity-provided'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['error-messages']['no-activity-provided'].message))
        .setTimestamp();

        if(!args[1]) return sendMessage({embeds: [noActivity]}).catch(err => {});

        var activity = args.slice(1).join(" ").split("`").join("");

        const success = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['activity-updated'].title))
        .setDescription(handleMessage(client, message.member.user, undefined, message.channel, messages['bot-cmds']['success-messages']['activity-updated'].message, [{ACTIVITY: activity}]))
        .setTimestamp();

        client.config.activity = activity;
        configHandler(client, client.config);

        client.user.setPresence({activities: [{name: handleMessage(client, client.user, undefined, {name: 'None', id: 'None'}, activity, [{MEMBER_COUNT: client.guilds.cache.reduce((a, g) => {return a+= g.memberCount})}]), type: ActivityType.Playing}], status: 'online'});
        clearInterval(client.presenceUpdate);

        var updatePresence = setInterval(function(){
            client.user.setPresence({activities: [{name: handleMessage(client, client.user, undefined, {name: 'None', id: 'None'}, activity, [{MEMBER_COUNT: client.guilds.cache.reduce((a, g) => {return a+= g.memberCount})}]), type: ActivityType.Playing}], status: 'online'});
        }, (1000*60*60));
    
        client.presenceUpdate = updatePresence;

        sendMessage({embeds: [success]}).catch(err => {});
    }
}
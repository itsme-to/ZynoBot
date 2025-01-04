const { EmbedBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'autoreply-select-action',
        description: 'When an action gets selected for the autoreply'
    },
    run: function(client, interaction){
        const value = interaction.values[0].toLowerCase();

        switch(value){
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Cancelled action`)
                .setDescription(`The action to change the autoreplies has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            case 'command':
                client.config.autoreply.command[interaction.guild.id] = !client.config.autoreply.command[interaction.guild.id];
                configHandler(client, client.config);

                const changedCommand = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Command autoreply ${client.config.autoreply.command === true ? `enabled` : `disabled`}`)
                .setDescription(`The command autoreply has successfully been ${client.config.autoreply.command === true ? `enabled`: `disabled`}`)
                .setTimestamp();

                interaction.update({embeds: [changedCommand], components: []}).catch(err => {});
                break;
            case 'song':
                client.config.autoreply.song[interaction.guild.id] = !client.config.autoreply.song[interaction.guild.id];
                configHandler(client, client.config);

                const changedSong = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Song autoreply ${client.config.autoreply.song === true ? `enabled`: `disabled`}`)
                .setDescription(`The song autoreply has successfully been ${client.config.autoreply.song === true ? `enabled`: `disabled`}`)
                .setTimestamp();

                interaction.update({embeds: [changedSong], components: []}).catch(err => {});
                break;
        }
    }
}
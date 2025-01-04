const { EmbedBuilder } = require('discord.js');
const configHandler = require('../../../handlers/saveConfig.js');

module.exports = {
    data: {
        id: 'change-level-difficulty',
        description: 'Changes the difficulty of the level system'
    },
    run: function(client, interaction){
        const value = interaction.values[0].toLowerCase();

        switch(value){
            case 'exponential-hard':
                client.config.level.difficulty[interaction.guild.id] = "EXPONENTIAL HARD";
                break;
            case 'exponential-normal':
                client.config.level.difficulty[interaction.guild.id] = "EXPONENTIAL NORMAL";
                break;
            case 'linear-normal':
                client.config.level.difficulty[interaction.guild.id] = "LINEAR NORMAL";
                break;
            case 'linear-hard':
                client.config.level.difficulty[interaction.guild.id] = "LINEAR HARD";
                break;
        }

        configHandler(client, client.config);

        const changedDifficulty = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Level difficulty changed`)
        .setDescription(`The difficulty of the level system has successfully been changed.`)
        .setTimestamp();

        return interaction.update({embeds: [changedDifficulty], components: []}).catch(err => {});
    }
}
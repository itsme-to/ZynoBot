const { EmbedBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'change-game-server-ip',
        description: 'When the new server ip gets provided'
    },
    run: function(client, interaction){
        const serverIp = interaction.fields.getTextInputValue('server-ip');
        const gameType = interaction.customId.split('__')[1];

        function getName(){
            if(gameType === "minecraft") return "Minecraft";
            else if(gameType === "fivem") return "FiveM";
        }

        client.config[gameType][interaction.guild.id].server = serverIp;
        configHandler(client, client.config);

        const changedEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
        .setTitle(`Server ip changed`)
        .setDescription(`The server ip of the ${getName()} commands has successfully been changed`)
        .setTimestamp();

        interaction.update({embeds: [changedEmbed], components: []}).catch(err => {});
    }
}
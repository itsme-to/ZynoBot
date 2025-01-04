const { EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } = require("discord.js");
const configHandler = require("../../../handlers/saveConfig.js");

module.exports = {
    data: {
        id: 'select-action-game-settings',
        description: 'When an action gets performed for a game'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();
        const gameType = interaction.customId.split('__')[1];

        function getName(){
            if(gameType === "minecraft") return "Minecraft";
            else if(gameType === "fivem") return "FiveM";
        }

        switch(action){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the game settings has been cancelled`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'disable':
                client.config[gameType][interaction.guild.id].server = false;
                configHandler(client, client.config);

                const disabled = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`${getName()} server ip removed`)
                .setDescription(`The server ip of the ${getName()} commands have successfully been removed`)
                .setTimestamp();

                interaction.update({embeds: [disabled], components: []}).catch(err => {});
                break;
            case 'change':
                const textInput = new TextInputBuilder()
                .setStyle(TextInputStyle.Short)
                .setCustomId(`server-ip`)
                .setLabel(`${getName()} server ip`)
                .setMinLength(1)
                .setMaxLength(100)
                .setRequired(true)
                .setPlaceholder(`No ip provided`);

                const textInputActionRow = new ActionRowBuilder().addComponents(textInput);

                const ipModal = new ModalBuilder()
                .setCustomId(`change-game-server-ip__${gameType}`)
                .setTitle(`Change the server ip`)
                .setComponents(textInputActionRow);
                
                interaction.showModal(ipModal).catch(err => {});
                break;
        }
    }
}
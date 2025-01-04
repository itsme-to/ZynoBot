const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'game-settings-action',
        description: 'When a game gets selected to change'
    },
    run: function(client, interaction){
        const action = interaction.values[0].toLowerCase();

        function getName(){
            if(action === "minecraft") return "Minecraft";
            else if(action === "fivem") return "FiveM";
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
            default:
                var options = [];
                if(typeof client.config[action][interaction.guild.id].server !== 'string'){
                    options.push({
                        label: `Set a server ip`,
                        description: `Enable the ${getName()} commands by adding a server ip`,
                        value: 'change'
                    });
                } else {
                    options.push({
                        label: `Change the server ip`,
                        description: `Change the server ip of the ${getName()} commands`,
                        value: 'change'
                    }, {
                        label: 'Remove the server ip',
                        description: `Remove the server ip of the ${getName()} commands`,
                        value: 'disable'
                    });
                }
                options.push({
                    label: 'Cancel',
                    description: 'Cancel this option',
                    value: 'cancel'
                });
                const gameActionSelect = new StringSelectMenuBuilder()
                .setCustomId(`select-action-game-settings__${action}`)
                .setPlaceholder(`No action selected`)
                .setOptions(options);

                const gameActionActionRow = new ActionRowBuilder().addComponents(gameActionSelect);

                const selectGameActionEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic: true })})
                .setTitle(`Select an action`)
                .setDescription(`Please select an action in the select menu below to perform the action`)
                .setTimestamp();

                interaction.update({embeds: [selectGameActionEmbed], components: [gameActionActionRow]}).catch(err => {});
                break;
        }
    }
}
const { EmbedBuilder } = require("discord.js");
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: {
        id: 'confirm-back-up',
        description: 'When the user confirms that there should be a back-up created of the bot'
    },
    run: function(client, interaction){
        if(client.isGeneratingBackUp === true){
            const generating = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username})
            .setTitle(`Back up is already being generated`)
            .setDescription(`There is already a back-up process going on. Please wait until the process ended before starting a new one.`)
            .setTimestamp();

            return interaction.editReply({embeds: [generating], components: []}).catch(err => {});
        }

        client.isGeneratingBackUp = true;

        const generateEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Generating back-up...`)
        .setDescription(`A back-up of Zyno Bot is being created, please be patient...`)
        .setTimestamp();

        interaction.update({embeds: [generateEmbed], components: []}).catch(console.log);

        const files = fs.readdirSync(path.join(__dirname, `../../../`));

        setTimeout(function(){
            const backUp = fs.createWriteStream(path.join(__dirname, `../../../zyno-bot-back-up.zip`));
            const archive = archiver('zip', {
                zlib: {level: 9}
            });
            archive.pipe(backUp);
            const index = files.indexOf('node_modules');
            if(index >= 0){
                files.splice(index, 1);
                files.push('node_modules/valuesaver/');
            }
            for(var i = 0; i < files.length; i++){
                const file = files[i];
                const basePath = path.join(__dirname, `../../../`, file);
                if(fs.statSync(basePath).isFile()){
                    archive.append(fs.readFileSync(basePath), {name: file});
                } else if(fs.statSync(basePath).isDirectory()){
                    archive.directory(basePath, file);
                }
            }

            archive.on('error', err => {
                console.log(`Error while generating back-up: `, err);
                const errorEmbed = new EmbedBuilder()
                .setColor(`RED`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Error`)
                .setDescription(`There was an error while generating the back-up`)
                .setTimestamp();

                client.isGeneratingBackUp = false;

                interaction.update({embeds: [errorEmbed]}).catch(err => {});
            });

            archive.finalize().then(() => {
                const finishedEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Back-up generated`)
                .setDescription(`The back-up of Zyno Bot has successfully been created and located at ${path.join(__dirname, `../../../zyno-bot-back-up.zip`)}`)
                .setTimestamp();

                client.isGeneratingBackUp = false;

                interaction.editReply({embeds: [finishedEmbed], components: []}).catch(err => {});
            });
        }, 2000);
    }
}
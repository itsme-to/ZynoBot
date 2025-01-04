const { EmbedBuilder } = require("discord.js");
const { wait } = require("../../../functions.js");

module.exports = {
    data: {
        id: 'change-db-type',
        description: 'Changes the database type and transfers the data to the corresponding database',
    },
    run: async function(client, interaction){
        const type = interaction.values[0].toLowerCase();

        const alreadySet = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Database already set`)
        .setDescription(`The database has already been set to \`${client.config.database.type}\`.`)
        .setTimestamp();

        switch(type){
            case 'cancel':
                const cancelEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to change the database has been cancelled.`)
                .setTimestamp();

                interaction.update({embeds: [cancelEmbed], components: []}).catch(err => {});
                break;
            case 'mysql':
                if(typeof client.config.database.mysql.host !== 'string' || typeof client.config.database.mysql.user !== 'string' || typeof client.config.database.mysql.password !== 'string' || typeof client.config.database.mysql.database !== 'string'){
                    const noDatabaseSet = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`No database set`)
                    .setDescription(`No MySQL database credentials have been set in the \`config.json\` file. Please provide the credentials inside the \`config.json\` file in order to switch to a MySQL database.`)
                    .setTimestamp();

                    return interaction.update({embeds: [noDatabaseSet], components: []}).catch(err => {});
                } else if(client.config.database.type.toLowerCase() === "mysql"){
                    return interaction.update({embeds: [alreadySet], components: []}).catch(err => {});
                }

                const connecting = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Connecting to the database...')
                .setDescription('Trying to connect to the MySQL database for validation...')
                .setTimestamp();

                interaction.update({embeds: [connecting], components: []}).catch(err => {});

                await wait(1e3);

                try{
                    await client.dbHandler.reconnect();
                } catch (err){
                    console.log(err);
                    const connectionFailed = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle(`Connection failed`)
                    .setDescription(`Failed to connect to the MySQL database. Please check if the credentials are correct. Check the console for more information.`)
                    .setTimestamp();

                    return interaction.editReply({embeds: [connectionFailed], components: []}).catch(err => {});
                }

                const settingUp = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Setting up database')
                .setDescription('The existing data is being transfered to the new MySQL database. This can take a while. All features will be temporarily disabled to prevent the data from becoming corrupt. Do **not** restart the bot!')
                .setTimestamp();

                client.dbTransfer = true;

                interaction.editReply({embeds: [settingUp], components: []}).catch(err => {});

                try{
                    await client.dbHandler.switchDB('MySQL');
                } catch (err){
                    console.log(err);

                    client.dbTransfer = false;

                    const transferError = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle('Setup failed')
                    .setDescription('There was an error while transfering the data to the MySQL database. Check the console for more information.')
                    .setTimestamp();
    
                    return interaction.editReply({embeds: [transferError]}).catch(err => {});
                }

                const transfered = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Setup completed')
                .setDescription('All data has been transfered to the MySQL database.')
                .setTimestamp();

                client.dbTransfer = false;

                return interaction.editReply({embeds: [transfered]}).catch(err => {});
                break;
            case 'valuesaver':
                if(client.config.database.type.toLowerCase() === "mysql"){
                    return interaction.update({embeds: [alreadySet], components: []}).catch(err => {});
                }
                const settingUpValueSaver = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Setting up database')
                .setDescription('The existing data is being transfered to the ValueSaver database. This can take a while. All features will be temporarily disabled to prevent the data from becoming corrupt. Do **not** restart the bot!')
                .setTimestamp();

                interaction.update({embeds: [settingUpValueSaver], components: []}).catch(err => {});

                client.dbTransfer = true;

                try{
                    await client.dbHandler.switchDB('ValueSaver');
                } catch (err){
                    console.log(err);

                    client.dbTransfer = false;

                    const transferErrorValueSaver = new EmbedBuilder()
                    .setColor(`Red`)
                    .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                    .setTitle('Setup failed')
                    .setDescription('There was an error while transfering the data to the ValueSaver database. Check the console for more information.')
                    .setTimestamp();
    
                    return interaction.editReply({embeds: [transferErrorValueSaver]}).catch(err => {});
                }

                client.dbTransfer = false;

                const transferedValueSaver = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle('Setup completed')
                .setDescription('All data has been transfered to the ValueSaver database.')
                .setTimestamp();

                return interaction.editReply({embeds: [transferedValueSaver]}).catch(err => {});
                break;
        }
    }
}
const { EmbedBuilder, PermissionsBitField, OverwriteType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { wait } = require("../../../functions");
const messages = require('../../../messages.json');
const messageHandler = require('../../../handlers/handleMessages.js');
const configHandler = require("../../../handlers/saveConfig.js");

function createRole(interaction){
    return new Promise((resolve) => {
        interaction.guild.roles.create({
            name: 'Unverified',
            reason: 'The role for unverified users'
        }).then(resolve).catch(err => {
            console.log(`Error while creating role: `, err);
            resolve(false);
        });
    });
}

module.exports = {
    data: {
        id: 'confirm-channel-verification',
        description: 'When the channel gets confirmed as the verification channel'
    },
    run: async function(client, interaction){
        const verificationType = interaction.customId.split('__')[1];
        const settingUp = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Loading...`)
        .setDescription(`I'm setting up your server so you can use the channel verification system`)
        .setTimestamp();

        interaction.update({embeds: [settingUp], components: []}).catch(err => {});

        await wait(300);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        var roleId = client.deepCopy((client.globals.get(`verification-role`) || {}));
        var channelId = client.deepCopy((client.globals.get(`verification-channel`) || {}));
        var role;

        if(!channelId[interaction.guild.id]) return interaction.editReply({embeds: [unknownInteraction]}).catch(err => {});

        const verifyChannel = await client.cache.getChannel(channelId[interaction.guild.id], interaction.guild);

        if(!roleId[interaction.guild.id]){
            role = await createRole(interaction);
        } else {
            role = await client.cache.getRole(roleId[interaction.guild.id], interaction.guild);
            await wait(300);
            if(!role) role = await createRole(interaction);
        }

        const errorCreate = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Error`)
        .setDescription(`There was an error while creating the unverified role`)
        .setTimestamp();

        if(!role) return interaction.editReply({embeds: [errorCreate]}).catch(err => {});

        roleId[interaction.guild.id] = role.id;
        try{
            await client.dbHandler.setValue('globals', roleId, {'globalsKey': 'verification-role'});
        } catch {}

        await wait(300);

        try{
            await interaction.guild.channels.fetch();
        } catch {}

        await wait(300);

        const channels = interaction.guild.channels.cache.filter(ch => {
            const permsFor = ch.permissionsFor(interaction.guild.roles.everyone.id);
            if(permsFor.has(PermissionsBitField.Flags.ViewChannel)) return true;
            else return false;
        }).map(ch => ch);

        var verificationChannel = false;
        for(var i = 0; i < channels.length; i++){
            const ch = channels[i];
            if(ch.id !== channelId[interaction.guild.id]){
                if(typeof ch.permissionOverwrites !== 'object') continue;
                ch.permissionOverwrites.create(role, {
                    ViewChannel: false
                }, {
                    type: OverwriteType.Role
                }).catch(console.log);
            } else {
                verificationChannel = true;
                ch.permissionOverwrites.create(ch.guild.roles.everyone, {
                    ViewChannel: false
                }, {
                    type: OverwriteType.Role
                }).catch(err => {});
                await wait(400);
                ch.permissionOverwrites.create(role, {
                    ViewChannel: true,
                    SendMessages: false
                }, {
                    type: OverwriteType.Role
                }).catch(err => {});
            }
            await wait(400);
        }
        
        if(verificationChannel === false){
            if(verifyChannel){
                verifyChannel.permissionOverwrites.create(role, {
                    ViewChannel: true,
                    SendMessages: false
                }, {
                    type: OverwriteType.Role
                }).catch(err => {});
            }
        }
        await wait(400);

        client.config.verificationType[interaction.guild.id] = verificationType.toUpperCase();
        configHandler(client, client.config);

        client.verifyChannel[interaction.guild.id] = verifyChannel;

        if(verificationType.toUpperCase() === "BUTTON"){
            const verifyEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages["verify-embeds"]["button-captcha-verify"].title))
            .setDescription(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages["verify-embeds"]["button-captcha-verify"].message))
            .setTimestamp();

            const verifyBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel(messageHandler(client, interaction.member.user, undefined, interaction.channel, messages["verify-embeds"]["verify-button"]))
            .setCustomId('verify-btn');

            const actionRow = new ActionRowBuilder().addComponents(verifyBtn);

            verifyChannel.send({embeds: [verifyEmbed], components: [actionRow]}).catch(err => {});

            await wait(4e2);
        }

        const changedVerification = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Verification system changed`)
        .setDescription(`The verification system has successfully been set to the ${verificationType} verification`)
        .setTimestamp();

        interaction.editReply({embeds: [changedVerification]}).catch(err => {});
    }
}
const { ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const messages = require('../../messages.json');
const handleMessage = require('../../handlers/handleMessages.js');
const { wait, generateVerify } = require('../../functions.js');

module.exports = {
    data: {
        id: 'verify-code',
        description: 'When a user provides the code to verify themselve'
    },
    run: async function(client, interaction){
        let verifyArr = client.deepCopy(client.unverified.get(interaction.user.id) || []);
        let verifyInfo = verifyArr.filter(u => u.messageId === interaction.message.id)[0];
        if(!verifyInfo) return interaction.deferUpdate().catch(err => {});
        if(Object.keys(client.mainguilds).indexOf(verifyInfo.guild) < 0) return interaction.deferUpdate().catch(err => {});
        let verificationCode = interaction.fields.getTextInputValue('code');

        let verificationIndex = verifyArr.indexOf(verifyInfo);
        if(verificationIndex >= 0) verifyArr.splice(verificationIndex, 1);

        if(verificationCode !== verifyInfo.code){
            if(client.config.verificationType[verifyInfo.guild] === "BUTTON"){
                const wrongEmbed = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.user, undefined, interaction.channel, messages['verify-embeds']['wrong-button'].title))
                .setDescription(handleMessage(client, interaction.user, undefined, interaction.channel, messages['verify-embeds']['wrong-button'].message))
                .setTimestamp();

                interaction.update({embeds: [wrongEmbed], files: [], components: []}).catch(err => {});

                try{
                    await client.dbHandler.deleteValue(`unverified`, {}, {memberId: interaction.user.id, guildId: verifyInfo.guild});
                } catch {}
                return;
            } else {
                interaction.deferUpdate().catch(err => {});
                await wait(400);
            }
            try{
                const verifyImage = await generateVerify(client.embedColor, client.mainguilds[verifyInfo.guild].iconURL({dynamic: false}));

                const attachment = new AttachmentBuilder()
                .setFile(verifyImage.buffer)
                .setName('verify-image.png');

                const verifyEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.user, undefined, {name: 'No name', id: 'No id'}, messages['verify-embeds'].wrong.title))
                .setDescription(handleMessage(client, interaction.user, undefined, {name: 'No name', id: 'No id'}, messages['verify-embeds'].wrong.message))
                .setImage('attachment://verify-image.png')
                .setTimestamp();

                const verifyButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel('Verify')
                .setCustomId('verify-user');

                const verifyActionRow = new ActionRowBuilder().addComponents(verifyButton);

                interaction.message.edit({embeds: [verifyEmbed], files: [attachment], components: [verifyActionRow]}).then(async () => {
                    
                    try{
                        await client.dbHandler.setValue(`unverified`, {code: verifyImage.code, messageId: verifyInfo.messageId, guild: verifyInfo.guild}, {memberId: interaction.user.id, guildId: verifyInfo.guild});
                    } catch (err){}
                }).catch(err => {});
            } catch {}
        } else {
            interaction.deferUpdate().catch(err => {});
            await wait(400);
            let verifiedSave = client.verified.get(interaction.user.id) || [];
            if(verifiedSave.indexOf(verifyInfo.guild) < 0) verifiedSave.push(verifyInfo.guild);
            client.verified.set(interaction.user.id, verifiedSave);
            if(client.config.verificationType[verifyInfo.guild] === "DM"){
                try{
                    await client.dbHandler.deleteValue(`unverified`, {}, {memberId: interaction.user.id, guildId: verifyInfo.guild});
                } catch {}
                var member;
                try {
                    member = await client.cache.getMember(interaction.user.id, client.mainguilds[verifyInfo.guild]);
                } catch {
                    return;
                }
                if(!member) return;
                member.disableCommunicationUntil(null, `Verified`).catch(err => {});
                await wait(400);
                const roles = [];
                for(var i = 0; i < client.config.joinRoles[verifyInfo.guild].length; i++){
                    const roleId = client.config.joinRoles[verifyInfo.guild][i];
                    try {
                        const role = await client.cache.getRole(roleId, client.mainguilds[verifyInfo.guild]);
                        await wait(200);
                        roles.push(role.id);
                    } catch {}
                }

                if(roles.length > 0) member.roles.add([...roles]).catch(err => {});
                await wait(400);
                const verifiedEmbed = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.user, undefined, interaction.channel, messages['verify-embeds'].correct.title))
                .setDescription(handleMessage(client, interaction.user, undefined, interaction.channel, messages['verify-embeds'].correct.message, [{GUILD_NAME: client.mainguilds[verifyInfo.guild].name}]))
                .setTimestamp();

                interaction.message.edit({embeds: [verifiedEmbed], components: [], files: []}).catch(err => {});
            } else if(client.config.verificationType[verifyInfo.guild] === "CHANNEL" || client.config.verificationType[verifyInfo.guild] === "BUTTON"){
                try{
                    await client.dbHandler.deleteValue(`unverified`, {}, {memberId: interaction.user.id, guildId: verifyInfo.guild});
                } catch {}
                const roles = [];
                for(var i = 0; i < client.config.joinRoles[verifyInfo.guild].length; i++){
                    const roleId = client.config.joinRoles[verifyInfo.guild][i];
                    const role = await client.cache.getRole(roleId, client.mainguilds[verifyInfo.guild]);
                    if(role) roles.push(role.id);
                }
                const unverifiedRole = client.deepCopy((client.globals.get(`verification-role`) || {}))[interaction.guild.id];
                interaction.member.roles.remove(unverifiedRole).catch(err => {});
                await wait(4e3);
                if(roles.length > 0) interaction.member.roles.add([...roles]).catch();

                await wait(400);

                interaction.message.delete().catch(err => {});
            }
        }
    }
}
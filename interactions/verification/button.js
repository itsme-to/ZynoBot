const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { generateVerify, wait } = require("../../functions");
const handleMessage = require('../../handlers/handleMessages.js');
const messages = require('../../messages.json');

let loading = {};

module.exports = {
    data: {
        id: 'verify-btn',
        description: 'When a member tries to verify itself using the button captcha'
    },
    run: async function(client, interaction){
        if(loading[interaction.member.id]) return interaction.deferUpdate().catch(err => {});
        loading[interaction.member.id] = true;
        try {
            await interaction.deferReply({ephemeral: true});

            await wait(4e2);

            const verifyImage = await generateVerify(client.embedColor, interaction.guild.iconURL({dynamic: false}));
            
            const attachment = new AttachmentBuilder()
            .setFile(verifyImage.buffer)
            .setName('verify-image.png');

            const verifyEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, {name: 'No name', id: 'No id'}, messages['verify-embeds'].verify.title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, {name: 'No name', id: 'No id'}, messages['verify-embeds'].verify.message))
            .setImage('attachment://verify-image.png')
            .setTimestamp();

            const verifyButton = new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Verify')
            .setCustomId('verify-user');

            const verifyActionRow = new ActionRowBuilder().addComponents(verifyButton);

            interaction.editReply({embeds: [verifyEmbed], files: [attachment], content: handleMessage(client, interaction.member.user, undefined, client.verifyChannel, messages['verify-embeds'].verifyMessage), components: [verifyActionRow], fetchReply: true}).then(async msg => {
                delete loading[interaction.member.id];

                let verifiedObj = {
                    code: verifyImage.code,
                    messageId: msg.id,
                    guild: interaction.guild.id
                };
                
                try{
                    await client.dbHandler.setValue(`unverified`, verifiedObj, {memberId: interaction.member.id, guildId: interaction.guild.id});
                } catch {}

            }).catch(err => {
                delete loading[interaction.member.id];
                if(client.config.debugger) console.log(err);
            });
        } catch(err) {
            delete loading[interaction.member.id];
            if(client.config.debugger) console.log(`Error while generating verification:`, err);
            console.log(err);
        }
    }
}
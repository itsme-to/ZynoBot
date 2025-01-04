const { EmbedBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const messages = require("../../messages.json");
const handleMessage = require("../../handlers/handleMessages.js");

module.exports = {
    data: {
        id: 'embed-builder',
        description: 'When a button is being clicked to build the embed'
    },
    run: function(client, interaction){
        const interactionInfo = interaction.customId.split("__")[1].toLowerCase();
        const interactionType = interactionInfo.split('-')[1];
        const memberId = interactionInfo.split('-')[0];

        const invalidUser = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({iconURL: client.user.displayAvatarURL({dynamic: true}), name: client.user.username})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-user"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.moderation.embed['error-messages']["invalid-user"].message))
        .setTimestamp();

        if(memberId !== interaction.member.id) return interaction.reply({embeds: [invalidUser], ephemeral: true}).catch(err => {});

        const textInputType = new TextInputBuilder()
        .setRequired(true)
        .setCustomId(`embed-builder-${interactionType}`);

        switch(interactionType){
            case 'title':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(256);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Title`);
                textInputType.setPlaceholder(`No title provided`);
                break;
            case 'description':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(4000);
                textInputType.setStyle(TextInputStyle.Paragraph);
                textInputType.setLabel(`Description`);
                textInputType.setPlaceholder(`No description provided`);
                break;
            case 'url':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(1000);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`URL`);
                textInputType.setPlaceholder(`No url provided`);
                break;
            case 'thumbnail':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(1000);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Thumbnail`);
                textInputType.setPlaceholder(`No image url provided`);
                break;
            case 'image':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(1000);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Image`);
                textInputType.setPlaceholder(`No image url provided`);
                break;
            case 'author text':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(256);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Author text`);
                textInputType.setPlaceholder(`No text provided`);
                break;
            case 'author image':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(1000);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Author image`);
                textInputType.setPlaceholder(`No image url provided`);
                break;
            case 'color':
                textInputType.setMinLength(4);
                textInputType.setMaxLength(7);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Color`);
                textInputType.setPlaceholder(`No text provided`);
                break;
            case 'footer text':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(256);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Footer text`);
                textInputType.setPlaceholder(`No text provided`);
                break;
            case 'footer image':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(1000);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Footer image`);
                textInputType.setPlaceholder(`No image url provided`);
                break;
            case 'timestamp':
                textInputType.setMinLength(3);
                textInputType.setMaxLength(15);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Timestamp`);
                textInputType.setPlaceholder(`No timestamp provided`);
                textInputType.setRequired(false);
                break;
            case 'send':
                textInputType.setMinLength(1);
                textInputType.setMaxLength(100);
                textInputType.setStyle(TextInputStyle.Short);
                textInputType.setLabel(`Channel name or id`);
                textInputType.setPlaceholder(`No channel provided`);
                break;
            case 'cancel':
                interaction.message.delete().catch(err => {});
                break;
        }

        const actionRow = new ActionRowBuilder().addComponents(textInputType);

        const interactionModal = new ModalBuilder()
        .setCustomId(`embed-builder-set__${interaction.member.id}-${interactionType}`)
        .setComponents(actionRow)
        .setTitle(interactionType !== 'send' ? `Set ${interactionType}` : `Send to channel`);

        interaction.showModal(interactionModal).catch(err => {});
    }
}
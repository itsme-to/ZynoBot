const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { validateEmote } = require("../../../functions");

module.exports = {
    data: {
        id: 'ticket-category-add-emoji',
        description: 'When an emoji gets passed for a ticket category'
    },
    run: function(client, interaction){
        const obj = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);
                
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!obj) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const emojiInput = interaction.fields.getTextInputValue('emoji') || '';

        if(!validateEmote(emojiInput) && emojiInput.length > 0){
            const invalidEmote = new EmbedBuilder()
            .setColor('Red')
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle('Invalid emote')
            .setDescription('The provided text is not an emote')
            .setTimestamp();
            return interaction.update({embeds: [invalidEmote], components: []}).catch(err => {});
        }

        obj['emote'] = emojiInput;
        client.interactionActions.set(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`, obj);

        const confirmEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle('Confirm your action')
        .setDescription(`Please confirm ${emojiInput.length > 0 ? `that you want to use ${emojiInput} as the emote for this category` : `that you don't want to use an emote for this category`}`)
        .setTimestamp();

        const confirmBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setLabel('Confirm')
        .setCustomId('ticket-category-confirm-emote');
        const cancelBtn = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel('Cancel')
        .setCustomId('ticket-category-cancel-emote');

        const btnActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

        interaction.update({embeds: [confirmEmbed], components: [btnActionRow]}).catch(err => {});
    }
}
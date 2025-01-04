const { EmbedBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'add-ticket-questions',
        description: 'When a member wants to add questions to a ticket category'
    },
    run: function(client, interaction){
        const interactionInfo = client.interactionActions.get(`manage-questions-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!interactionInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const categories = client.deepCopy(client.globals.get(`ticket-categories`) ?? {})[interaction.guild.id] ?? [];
        const selectedCategory = categories.filter(c => c.name === interactionInfo.category)[0];

        const categoryNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Category not found`)
        .setDescription(`The ticket category you want to add or remove questions for wasn't found.`)
        .setTimestamp();

        if(!selectedCategory) return interaction.update({embeds: [categoryNotFound], components: []}).catch(err => {});

        const invalidAmount = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Invalid amount of new questions`)
        .setDescription(`The maximum amount of questions per ticket category is 3.`)
        .setTimestamp();

        let totalNew = interaction.values[0];
        if(!/^[0-9]{1}$/.test(totalNew)) return interaction.update({embeds: [invalidAmount], components: []}).catch(err => {});

        totalNew = parseInt(totalNew);
        if((totalNew + (selectedCategory.questions ?? []).length) > 3) return interaction.update({embeds: [invalidAmount]}).catch(err => {});

        const inputModal = new ModalBuilder()
        .setCustomId('add-ticket-questions-name')
        .setTitle('Add questions')

        for(let i = totalNew; i > 0; i--){
            const input = new TextInputBuilder()
            .setStyle(TextInputStyle.Short)
            .setLabel(`Question ${totalNew - i + (selectedCategory.questions ?? []).length + 1}`)
            .setCustomId(`question-${totalNew - i + (selectedCategory.questions ?? []).length + 1}`)
            .setRequired(true)
            .setPlaceholder(`No question provided`)
            .setMaxLength(45)
            .setMinLength(1);
            inputModal.addComponents((new ActionRowBuilder()).addComponents(input));
        }

        interaction.showModal(inputModal).catch(err => {});
    }
}
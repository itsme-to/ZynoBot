const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'select-action-ticket-questions',
        description: 'When a member has choosen whether to add or remove questions'
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

        switch(interaction.values[0].toLowerCase()){
            case 'cancel':
                const cancelled = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Action cancelled`)
                .setDescription(`The action to add or remove questions for a ticket category has been cancelled.`)
                .setTimestamp();

                return interaction.update({embeds: [cancelled], components: []}).catch(err => {});
                break;
            case 'add':
                const maxQuestionsReached = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            	.setTitle(`Max questions reached`)
                .setDescription(`You have already reached the maximum amount of questions of 3 for this ticket category.`)
                .setTimestamp();

                if((selectedCategory.questions ?? []).length >= 3) return interaction.update({embeds: [maxQuestionsReached], components: []}).catch(err => {});

                const availableQuestions = 3 - (selectedCategory.questions ?? []).length;

                const amount = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Amount of questions`)
                .setDescription(`How many questions would you like to add?`)
                .setTimestamp();

                let questionOptions = [];

                let emojis = {
                    '1': '1️⃣',
                    '2': '2️⃣',
                    '3': '3️⃣'
                };

                for(let i = 1; i <= availableQuestions; i++){
                    questionOptions.push({
                        emoji: emojis[i.toString()],
                        label: `${i} question${i > 1 ? 's': ''}`,
                        value: i.toString()
                    });
                }

                const selectAmount = new StringSelectMenuBuilder()
                .setCustomId(`add-ticket-questions`)
                .setPlaceholder(`No amount selected`)
                .setOptions([...questionOptions, {
                    label: 'Cancel',
                    value: 'cancel',
                    description: 'Cancel this action'
                }]);

                const actionRowAdd = new ActionRowBuilder().addComponents(selectAmount);

                client.interactionActions.set(`manage-questions-${interaction.member.id}-${interaction.guild.id}`, {...interactionInfo, type: 'add'});

                interaction.update({embeds: [amount], components: [actionRowAdd]}).catch(err => {});
                break;
            case 'remove':
                const noQuestionsAdded = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            	.setTitle(`No questions set`)
                .setDescription(`There have no questions been added for this ticket category and can therefore not be removed.`)
                .setTimestamp();

                if((selectedCategory.questions ?? []).length === 0) return interaction.update({embeds: [noQuestionsAdded], components: []}).catch(err => {});

                const selectQuestion = new EmbedBuilder()
                .setColor(client.embedColor)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(`Select a question to remove`)
                .setDescription(`Select one of the questions mentioned in the menu below to remove it from the ticket category \`${interactionInfo.name}\`.`)
                .setTimestamp();

                const selectRemove = new StringSelectMenuBuilder()
                .setCustomId(`remove-ticket-questions`)
                .setPlaceholder(`No question selected`)
                .setOptions([...selectedCategory.questions.map((q, i) => {
                    return {
                        label: q,
                        value: `i-${i}`
                    }
                }), {
                    label: 'All',
                    description: 'Remove all questions',
                    value: 'all'
                }, {
                    label: 'Cancel',
                    description: 'Cancel this action',
                    value: 'cancel'
                }]);

                const actionRowRemove = new ActionRowBuilder().addComponents(selectRemove);

                client.interactionActions.set(`manage-questions-${interaction.member.id}-${interaction.guild.id}`, {...interactionInfo, type: 'remove'});

                interaction.update({embeds: [selectQuestion], components: [actionRowRemove]}).catch(err => {});
                break;
        }
    }
}
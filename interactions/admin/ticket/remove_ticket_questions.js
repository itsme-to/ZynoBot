const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'remove-ticket-questions',
        description: 'When a member chooses to remove one or more questions'
    },
    run: async function(client, interaction){
        const interactionInfo = client.interactionActions.get(`manage-questions-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!interactionInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        client.interactionActions.delete(`manage-questions-${interaction.member.id}-${interaction.guild.id}`);

        const categories = client.deepCopy(client.globals.get(`ticket-categories`) ?? {})
        const guildCategories = categories[interaction.guild.id] ?? [];
        const selectedCategory = guildCategories.filter(c => c.name === interactionInfo.category)[0];
        const selectedCategoryIndex = guildCategories.indexOf(selectedCategory);

        const categoryNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Category not found`)
        .setDescription(`The ticket category you want to add or remove questions for wasn't found.`)
        .setTimestamp();

        if(!selectedCategory) return interaction.update({embeds: [categoryNotFound], components: []}).catch(err => {});

        const noQuestionsAdded = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`No questions set`)
        .setDescription(`There have no questions been added for this ticket category and can therefore not be removed.`)
        .setTimestamp();

        if((selectedCategory.questions ?? []).length === 0) return interaction.update({embeds: [noQuestionsAdded], components: []}).catch(err => {});

        const removeQuestion = interaction.values[0].toLowerCase();
        
        const cancelled = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Action cancelled`)
        .setDescription(`The action to add or remove questions for a ticket category has been cancelled.`)
        .setTimestamp();

        if(removeQuestion === "cancel") return interaction.update({embeds: [cancelled], components: []}).catch(err => {});
        else if(removeQuestion === "all"){
            selectedCategory.questions = [];
        } else {
            const questionNotFound = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Question not found`)
            .setDescription(`The question you were trying to remove from the ticket category wasn't found.`)
            .setTimestamp();

            const questionIndex = removeQuestion.split("i-")[1];
            if(!/^[0-9]{1,2}$/.test(questionIndex)) return interaction.update({embeds: [questionNotFound], components: []}).catch(err => {});
        
            const parseIndex = parseInt(questionIndex);
            if(parseIndex >= selectedCategory.questions.length) return interaction.update({embeds: [questionNotFound], components: []}).catch(err => {});

            selectedCategory.questions.splice(parseIndex, 1);
        }

        guildCategories[selectedCategoryIndex] = selectedCategory;
        categories[interaction.guild.id] = guildCategories;

        try{
            await client.dbHandler.setValue(`globals`, categories, {'globalsKey': 'ticket-categories'});
        } catch {}

        const questionsRemoved = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Question(s) removed`)
        .setDescription(`The question(s) have successfully been removed from the corresponding ticket category.`)
        .setTimestamp();

        interaction.update({embeds: [questionsRemoved], components: []}).catch(err => {});
    }
}
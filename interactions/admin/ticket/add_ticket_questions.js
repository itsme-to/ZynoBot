const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'add-ticket-questions-name',
        description: 'When the member provides the questions to add'
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

        const questions = Array.from(interaction.fields.fields.values()).map(q => q.value);

        const maxQuestionsReached = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Max questions reached`)
        .setDescription(`You have already reached the maximum amount of questions of 3 for this ticket category.`)
        .setTimestamp();

        if((selectedCategory.questions ?? []).length + questions.length > 3) return interaction.update({embeds: [maxQuestionsReached], components: []}).catch(err => {});

        selectedCategory.questions = Array.isArray(selectedCategory.questions) ? selectedCategory.questions.concat(questions) : questions;
        guildCategories[selectedCategoryIndex] = selectedCategory;
        categories[interaction.guild.id] = guildCategories;

        try{
            await client.dbHandler.setValue(`globals`, categories, {'globalsKey': 'ticket-categories'});
        } catch {}

        const questionsAdded = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Question(s) added`)
        .setDescription(`The question(s) have successfully been added to the corresponding ticket category.`)
        .setTimestamp();

        interaction.update({embeds: [questionsAdded], components: []}).catch(err => {});
    }
}
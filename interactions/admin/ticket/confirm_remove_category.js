const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'confirm-remove-ticket-category',
        description: 'When the user confirms that the ticket category should be removed'
    },
    run: async function(client, interaction){
        let emptyCategory = {};
        emptyCategory[interaction.guild.id] = [];
        const categories = client.deepCopy((client.globals.get(`ticket-categories`) || emptyCategory));
        if(!categories[interaction.guild.id]) categories[interaction.guild.id] = [];

        const removeCategory = client.interactionActions.get(`remove-ticket-category-${interaction.member.id}-${interaction.guild.id}`);

        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();

        if(!removeCategory) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const categoryNotFound = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Ticket category not found`)
        .setDescription(`The ticket category you're trying to remove cannot be found.`)
        .setTimestamp();

        const getCategory = categories[interaction.guild.id].filter(c => c.name.toLowerCase() === removeCategory.name.toLowerCase());
        if(getCategory.length < 1) return interaction.update({embeds: [categoryNotFound], components: []}).catch(err => {});

        const i = categories[interaction.guild.id].indexOf(getCategory[0]);
        if(i < 0) return interaction.update({embeds: [categoryNotFound], components: []}).catch(err => {});

        categories[interaction.guild.id].splice(i, 1);
        client.interactionActions.delete(`remove-ticket-category-${interaction.member.id}-${interaction.guild.id}`);
        try{
            await client.dbHandler.setValue('globals', categories, {'globalsKey': `ticket-categories`});
        } catch {}

        const removed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Removed ticket category`)
        .setDescription(`The ticket category `+"`"+removeCategory.name+"`"+` has successfully been removed.`)
        .setTimestamp();

        interaction.update({embeds: [removed], components: []}).catch(err => {});
    }
}
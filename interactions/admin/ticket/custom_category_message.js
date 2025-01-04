const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        id: 'custom-ticket-category-description',
        description: 'When the custom ticket category description gets received'
    },
    run: async function(client, interaction){
        const unknownInteraction = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Unknown interaction`)
        .setDescription(`The interaction was unknown, please try it again`)
        .setTimestamp();
        
        const ticketCategoryInfo = client.interactionActions.get(`add-ticket-category-${interaction.member.id}-${interaction.guild.id}`);
        if(!ticketCategoryInfo) return interaction.update({embeds: [unknownInteraction], components: []}).catch(err => {});

        const description = interaction.fields.getTextInputValue('description');

        let categories = client.deepCopy((client.globals.get(`ticket-categories`) ?? {}));
        if(!categories[interaction.guild.id]){
            categories[interaction.guild.id] = [];
        }

        const maxEmbed = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Max categories`)
        .setDescription(`You've already reached the max amount of ticket categories of 9. Please remove a ticket category before adding a new one.`)
        .setTimestamp();

        if(categories[interaction.guild.id].length >= 9) return interaction.update({embeds: [maxEmbed], components: []}).catch(err => {});
        
        let categoryObj = {name: ticketCategoryInfo.name, color: ticketCategoryInfo.color, parentId: ticketCategoryInfo.parentId, emote: ticketCategoryInfo.emote || null};
        if(typeof ticketCategoryInfo.role === 'string'){
            categoryObj['role'] = ticketCategoryInfo.role;
        }
        if((description || '').length > 0){
            categoryObj['description'] = description;
        }

        categories[interaction.guild.id].push(categoryObj);
        try{
            await client.dbHandler.setValue('globals', categories, {'globalsKey': `ticket-categories`});
        } catch {}

        const saved = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Ticket category added`)
        .setDescription(`The ticket category has successfully been added.`)
        .setTimestamp();

        interaction.update({embeds: [saved], components: []}).catch(err => {});
    }
}
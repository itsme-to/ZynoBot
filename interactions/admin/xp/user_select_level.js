const { EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'user-select-level',
        description: 'The user whose level should be changed'
    },
    run: function(client, interaction){
        const user = interaction.fields.getTextInputValue(`user`);

        new Promise(async (resolve, reject) => {
            const regExId = /^[0-9]*$/;
            if(regExId.test(user)){
                try {
                    const member = await client.cache.getMember(user.toString(), interaction.guild);
                    resolve(member);
                } catch {
                    reject();
                }
            } else if(user.indexOf(`#`) >= 0){
                const getTag = interaction.guild.id.members.cache.filter(m => m.user.username === user);
                if(getTag.size > 0){
                    resolve(getTag.first());
                    return;
                }
                const includesTag = interaction.guild.members.cache.filter(m => m.user.username.toLowerCase().includes(user.toLowerCase()));
                if(includesTag.size > 0){
                    resolve(includesTag.first());
                    return;
                }
                const tagIncludes = interaction.guild.members.cache.filter(m => user.toLowerCase().includes(m.user.username.toLowerCase()));
                if(tagIncludes.size > 0){
                    resolve(tagIncludes.first());
                    return;
                }
                reject();
            } else {
                const getUsername = interaction.guild.members.cache.filter(m => m.user.username === user);
                if(getUsername.size > 0){
                    resolve(getUsername.first());
                    return;
                }
                const includesUsername = interaction.guild.members.cache.filter(m => m.user.username.toLowerCase().includes(user.toLowerCase()));
                if(includesUsername.size > 0){
                    resolve(includesUsername.first());
                    return;
                }
                const usernameIncludes = interaction.guild.members.cache.filter(m => user.toLowerCase().includes(m.user.username.toLowerCase()));
                if(usernameIncludes.size > 0){
                    resolve(usernameIncludes.first());
                    return;
                }
                reject();
            }
        }).then(member => {
            const confirmMember = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Confirm member`)
            .setDescription(`Please confirm that you mean the member <@!${member.id}>`)
            .setTimestamp();

            const confirmBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setLabel(`Confirm`)
            .setCustomId(`confirm-level-member`);
            const cancelBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setLabel(`Cancel`)
            .setCustomId(`cancel-level-member`);

            const actionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

            client.interactionActions.set(`level-member-${interaction.member.id}-${interaction.guild.id}`, member);

            interaction.update({embeds: [confirmMember], components: [actionRow]}).catch(err => {});
        }).catch(() => {
            const noUserFound = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`No member found`)
            .setDescription(`There was no member found matching the given information`)
            .setTimestamp();

            interaction.update({embeds: [noUserFound], components: []}).catch(err => {});
        });
    }
}
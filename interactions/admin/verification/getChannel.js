const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } = require("discord.js");

module.exports = {
    data: {
        id: 'verification-channel',
        description: 'When the verification channel gets provided'
    },
    run: function(client, interaction){
        const verificationType = interaction.customId.split('__')[1];
        const channelInput = interaction.fields.getTextInputValue(`channel`);
        
        new Promise(async (resolve, reject) => {
            const regEx = /^[0-9]*$/;
            if(regEx.test(channelInput)){
                try {
                    const channel = await client.cache.getChannel(channelInput, interaction.guild);
                    if(channel.type === ChannelType.GuildText) resolve(channel);
                    else reject();
                } catch {
                    reject();
                }
            } else {
                const channel = interaction.guild.channels.cache.filter(ch => ch.name === channelInput && ch.type === ChannelType.GuildText);
                if(channel.size > 0){
                    resolve(channel.first());
                } else {
                    const findChannel = interaction.guild.channels.cache.filter(ch => ch.name.includes(channelInput) && ch.type === ChannelType.GuildText);
                    if(findChannel.size > 0){
                        resolve(findChannel.first());
                    } else {
                        const findChannel2 = interaction.guild.channels.cache.filter(ch => channelInput.includes(ch.name) && ch.type === ChannelType.GuildText);
                        if(findChannel2.size > 0){
                            resolve(findChannel2.first());
                        } else {
                            reject();
                        }
                    }
                }
            }
        }).then(ch => {
            const confirmEmbed = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`Confirm the channel`)
            .setDescription(`Do you want to make <#${ch.id}> the verification channel?`)
            .setTimestamp();
            const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm-channel-verification__${verificationType}`)
            .setLabel(`Confirm`)
            .setStyle(ButtonStyle.Success);
            const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel-channel-verification__${verificationType}`)
            .setLabel(`Cancel`)
            .setStyle(ButtonStyle.Danger);
            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
            interaction.update({embeds: [confirmEmbed], components: [actionRow]}).then(async () => {
                let currentVerificationChannels = client.deepCopy((client.globals.get(`verification-channel`) || {}));
                currentVerificationChannels[interaction.guild.id] = ch.id;
                try{
                    await client.dbHandler.setValue('globals', currentVerificationChannels, {'globalsKey': 'verification-channel'});
                } catch {}
            }).catch(err => {});
        }).catch(() => {
            const noFound = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(`No channel found`)
            .setDescription(`There was no channel found which matches the given input`)
            .setTimestamp();

            interaction.update({embeds: [noFound], components: []}).catch(err => {});
        });
    }
}
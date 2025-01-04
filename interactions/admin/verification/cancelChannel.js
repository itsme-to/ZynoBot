const { EmbedBuilder } = require("discord.js");

module.exports = {
    data: {
        id: 'cancel-channel-verification',
        description: 'When the verification channel gets cancelled'
    },
    run: async function(client, interaction){
        let currentVerificationChannels = client.deepCopy((client.globals.get(`verification-channel`) || {}));
        delete currentVerificationChannels[interaction.guild.id];
        try{
            await client.dbHandler.setValue('globals', currentVerificationChannels, {'globalsKey': 'verification-channel'});
        } catch {}

        const cancelled = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(`Cancelled action`)
        .setDescription(`The action to change the verification system has been cancelled`)
        .setTimestamp();

        interaction.update({embeds: [cancelled], components: []}).catch(err => {});
    }
}
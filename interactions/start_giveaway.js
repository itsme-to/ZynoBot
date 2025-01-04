const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const messages = require('../messages.json');
const handleMessage = require('../handlers/handleMessages.js');
const { wait } = require("../functions.js");

function firstUppercase(str){
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}

module.exports = {
    data: {
        id: 'requirements-values-giveaway',
        description: 'When the requirements of the giveaway are provided'
    },
    run: async function(client, interaction){
        const giveawayInfo = client.interactionActions.get('giveaway-start-'+interaction.member.id+'-'+interaction.guild.id);

        const interactionUnknown = new EmbedBuilder()
        .setColor(`Red`)
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements["unknown-interaction"].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements["unknown-interaction"].message))
        .setTimestamp();

        if(!giveawayInfo) return interaction.update(handleContent({embeds: [interactionUnknown], components: []})).catch(err => {});

        let requirementObject = {
            invites: 0,
            level: 0,
            messages: 0,
            role: null
        };

        let _msg = null;

        if(giveawayInfo.requirementTypes.indexOf('role') >= 0){
            const roleIdName = interaction.fields.getTextInputValue('role');
            console.log(roleIdName);

            const roleNotFound = new EmbedBuilder()
            .setColor(`Red`)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements['role-not-found'].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements["role-not-found"].message))
            .setTimestamp();

            let roleReqId = null;

            if(!/^[0-9]*$/.test(roleIdName)){
                try{
                    let roleObj = await new Promise((resolve, reject) => {
                        const role = interaction.guild.roles.cache.filter(role => role.name.toLowerCase() === roleIdName.toLowerCase());
                        if(role.size > 0){
                            resolve(role.first());
                        } else {
                            const findRole = interaction.guild.roles.cache.filter(role => role.name.toLowerCase().includes(roleIdName.toLowerCase()));
                            if(findRole.size > 0){
                                resolve(findRole.first());
                            } else {
                                const findRole2 = interaction.guild.roles.cache.filter(role => roleIdName.toLowerCase().includes(role.name.toLowerCase()));
                                if(findRole2.size > 0){
                                    resolve(findRole2.first());
                                } else {
                                    reject();
                                }
                            }
                        }
                    });
                    roleReqId = roleObj.id;
                } catch {
                    return interaction.update({embeds: [roleNotFound], components: []}).catch(err => {});
                }
            } else {
                const getRole = await client.cache.getRole(roleIdName, interaction.guild);
                if(!getRole) return interaction.update({embeds: [roleNotFound], components: []}).catch(err => {});
                roleReqId = getRole.id;
            }
            
            const confirmRole = new EmbedBuilder()
            .setColor(client.embedColor)
            .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
            .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements['confirm-role'].title))
            .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements["confirm-role"].message, [{ROLE: `<@&${roleReqId}>`}]))
            .setTimestamp();

            const confirmBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId('confirm-requirement-role')
            .setLabel(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements["confirm-role"].confirm));

            const cancelBtn = new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setCustomId('cancel-requirement-role')
            .setLabel(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements["confirm-role"].cancel));

            const confirmActionRow = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

            try{
                await new Promise(async (resolve, reject) => {
                    try{
                        _msg = await interaction.update({embeds: [confirmRole], components: [confirmActionRow]});
                    } catch {
                        reject();
                        return;
                    }

                    let collector = _msg.createMessageComponentCollector({
                        filter: i => i.user.id === interaction.member.id,
                        max: 1,
                        time: 3*6e4
                    });

                    collector.once('collect', async i => {
                        i.deferUpdate().catch(err => {});
                        await wait(4e2);
                        if(i.customId === 'confirm-requirement-role'){
                            requirementObject['role'] = roleReqId;
                            resolve();
                        } else {
                            reject();
                        }
                    });

                    collector.once('end', collected => {
                        if(collected.size === 0) reject();
                    });
                });
            } catch {
                const cancelled = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements['cancel-role-requirement'].title))
                .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements['cancel-role-requirement'].message, [{ROLE: `<@&${roleReqId}>`}]))
                .setTimestamp();

                let fields = {embeds: [cancelled], components: []};

                new Promise((resolve, reject) => {
                    if(_msg === null) interaction.update(fields).then(resolve).catch(reject);
                    else _msg.edit(fields).then(resolve).catch(reject);
                }).catch(err => {});
                return;
            }
        }

        for(var i = 0; i < giveawayInfo.requirementTypes.length; i++){
            let requirementType = giveawayInfo.requirementTypes[i];
            if(requirementType === 'role') continue;
            let reqVal = interaction.fields.getTextInputValue(requirementType);
            if(!/^[0-9]{1,3}$/.test(reqVal)){
                const invalidRequirement = new EmbedBuilder()
                .setColor(`Red`)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements["invalid-requirements"].title))
                .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirements["invalid-requirements"].message))
                .setTimestamp();

                interaction.update(client.handleContent({embeds: [invalidRequirement], components: []})).catch(err => {});
                return;
            } else {
                requirementObject[requirementType] = parseInt(reqVal);
            }
        }

        const giveawayEmbed = new EmbedBuilder()
        .setColor(client.embedColor)
        .setAuthor({name: giveawayInfo.priceName, iconURL: client.user.displayAvatarURL({dynamic: true})})
        .setTitle(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start['embed'].title))
        .setDescription(handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start['embed'].message, [{PRIZE: giveawayInfo.priceName, WINNERS: giveawayInfo.winners, TIMESTAMP: `<t:${giveawayInfo.clientEndTimestamp}>`, REQUIREMENTS: giveawayInfo.requirementTypes.reduce((str, item, i) => {
            let addVal = item !== 'role' ? handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirement, [{REQUIREMENT: `${requirementObject[item]} ${item}`}]) : handleMessage(client, interaction.member.user, undefined, interaction.channel, messages.giveaway.start.embed.requirement, [{REQUIREMENT: `${firstUppercase(item)}: <@&${requirementObject[item]}>`}]);
            if(i > 0) addVal = `\n`+addVal;
            str += addVal;
            return str;
        }, ``)}]))
        .setTimestamp(giveawayInfo.endTimestamp);

        delete giveawayInfo['requirementTypes'];

        let fields = {embeds: [giveawayEmbed], fetchReply: true, components: []};
        new Promise((resolve, reject) => {
            if(_msg === null) interaction.update(fields).then(resolve).catch(reject);
            else _msg.edit(fields).then(resolve).catch(reject);
        }).then(async msg => {
            msg.react(`🥳`).catch(err => {});
            try{
                await client.dbHandler.setValue(`giveaways`, {messageId: msg.id, ...giveawayInfo, requirements: requirementObject}, {messageId: msg.id});
            } catch {}
            client.giveawayHandler.handle(msg.id);
        }).catch(err => {});
    }
}
const fs = require('fs/promises');
const path = require('path');
const { ValueSaver } = require('valuesaver');
var config = require('./config.json');

const economy = new ValueSaver();
const badwords = new ValueSaver();
const globals = new ValueSaver();
const userinfo = new ValueSaver();
const xp = new ValueSaver();
const unverified = new ValueSaver();
const tickets = new ValueSaver();
const suggestions = new ValueSaver();

(async () => {
    await economy.import('economy');
    await badwords.import('badwords');
    await globals.import('globals');
    await userinfo.import('userinfo');
    await xp.import('xp');
    await unverified.import('unverified');
    await tickets.import('tickets');
    await suggestions.import('suggestions');
    if(typeof config.guild !== 'undefined'){
        config['guilds'] = [config.guild];
        var ticketRoles = Array.from(config.tickets.roles);
        config.tickets.roles = {};
        config.tickets.roles[config.guild] = ticketRoles;
        var ticketParent = String(config.tickets.parent);
        config.tickets.parent = {};
        config.tickets.parent[config.guild] = ticketParent;
        var joinRoles = Array.from(config.joinRoles);
        config.joinRoles = {};
        config.joinRoles[config.guild] = joinRoles;
        var moderatorRoles = Array.from(config.moderator_roles);
        config.moderator_roles = {};
        config.moderator_roles[config.guild] = moderatorRoles;
        var mcSettings = {...config.minecraft};
        var fivemSettings = {...config.fivem};
        config.minecraft = {};
        config.minecraft[config.guild] = mcSettings;
        config.fivem = {};
        config.fivem[config.guild] = fivemSettings;
        var verificationType = String(config.verificationType);
        config.verificationType = {};
        config.verificationType[config.guild] = verificationType;
        delete config.welcome.embed;
        config.welcome['type'] = "IMAGE";
        delete config.leave.embed;
        config.leave['type'] = "IMAGE";
        var welcomeSettings = {...config.welcome};
        var leaveSettings = {...config.leave};
        config.welcome = {};
        config.welcome[config.guild] = welcomeSettings;
        config.leave = {};
        config.leave[config.guild] = leaveSettings;
        var newFilterObj = {};
        for(var key in config.filters){
            var boolean = config.filters[key];
            newFilterObj[key] = {};
            newFilterObj[key][config.guild] = boolean;
        }
        config.filters = newFilterObj;
        var levelNotificationChannel = String(config.level['notification-channel']);
        config.level['notification-channel'] = {};
        config.level['notification-channel'][config.guild] = levelNotificationChannel;
        var logsChannel = String(config.logs);
        config.logs = {};
        config.logs[config.guild] = logsChannel;
        var countingChannel = String(config.countingChannel);
        config.countingChannel = {};
        config.countingChannel[config.guild] = countingChannel;
        var snakeChannel = String(config.snakeChannel);
        config.snakeChannel = {};
        config.snakeChannel[config.guild] = snakeChannel;
        var suggestionChannel = String(config.suggestionChannel);
        config.suggestionChannel = {};
        config.suggestionChannel[config.guild] = suggestionChannel;
        var dmTicket = config.tickets.dm;
        config.tickets.dm = {};
        config.tickets.dm[config.guild] = dmTicket;
        var categoryType = config.tickets.categoryType;
        config.tickets.categoryType = {};
        config.tickets.categoryType[config.guild] = categoryType;
        var maxTickets = config.tickets.max;
        config.tickets.max = {};
        config.tickets.max[config.guild] = maxTickets;
        var autoreplySong = config.autoreply.song;
        config.autoreply.song = {};
        config.autoreply.song[config.guild] = autoreplySong;
        var autoreplyCommand = config.autoreply.command;
        config.autoreply.command = {};
        config.autoreply.command[config.guild] = autoreplyCommand;
        var levelUpMessages = config.level['level-up-messages'];
        config.level['level-up-messages'] = {};
        config.level['level-up-messages'][config.guild] = levelUpMessages;
        var logMessages = config.logMessages;
        config.logMessages = {};
        config.logMessages[config.guild] = logMessages;
        config.spotifyCredentials = {
            clientId: null,
            clientSecret: null
        }

        const ticketsArr = tickets.toReadableArray();
        for(var i = 0; i < ticketsArr.length; i++){
            var ticketUser = ticketsArr[i];
            if(typeof ticketUser.value === 'string'){
                ticketUser.value = [{channel: ticketUser.value, claimed: false, closed: false, category: false, guild: config.guild}];
            } else if(Array.isArray(ticketUser.value)){
                var openTickets = [];
                for(var z = 0; z < ticketUser.value.length; i++){
                    var ticketVal = ticketUser.value[i];
                    if(typeof ticketVal === 'string'){
                        openTickets.push({channel: ticketVal, closed: false, claimed: false, category: false, guild: config.guild});
                    } else if(typeof ticketVal === 'object'){
                        ticketVal['guild'] = config.guild;
                        openTickets.push(ticketVal);
                    }
                }
                ticketUser.value = openTickets;
            } else {
                continue;
            }
            tickets.set(ticketUser.key, ticketUser.value);
        }
        try{
            await tickets.save('tickets');
        } catch {}
        const economyArr = economy.toReadableArray();
        for(var i = 0; i < economyArr.length; i++){
            var economyObj = economyArr[i];
            if(Array.isArray(economyObj.value)) continue;
            economyObj.value['guild'] = config.guild;
            economy.set(economyObj.key, [economyObj.value]);
        }
        try{
            await economy.save('economy');
        } catch {}
        const badwordsArr = badwords.toReadableArray();
        const _badwords = [];
        for(var i = 0; i < badwordsArr.length; i++){
            var badwordObj = badwordsArr[i];
            if(Array.isArray(badwordObj.value)) continue;
            _badwords.push(badwordObj.key);
        }
        if(_badwords.length > 0){
            badwords.clear();
            badwords.set(config.guild, _badwords);
            try{
                await badwords.save('badwords');
            } catch {}
        }
        const userinfoArr = userinfo.toReadableArray();
        for(var i = 0; i < userinfoArr.length; i++){
            var userinfoObj = userinfoArr[i];
            if(Array.isArray(userinfoObj.value)) continue;
            userinfoObj.value['guild'] = config.guild;
            userinfo.set(userinfoObj.key, [userinfoObj.value]);
        }
        try{
            await userinfo.save('userinfo');
        } catch {}
        const xpArr = xp.toReadableArray();
        for(var i = 0; i < xpArr.length; i++){
            var xpObj = xpArr[i];
            if(Array.isArray(xpObj.value)) continue;
            xpObj.value['guild'] = config.guild;
            xp.set(xpObj.key, [xpObj.value]);
        }
        try{
            await xp.save('xp');
        } catch {}
        const unverifiedArr = unverified.toReadableArray();
        for(var i = 0; i < unverifiedArr.length; i++){
            var unverifiedObj = unverifiedArr[i];
            if(Array.isArray(unverifiedObj.value)) continue;
            unverifiedObj.value['guild'] = config.guild;
            unverified.set(unverifiedObj.key, [unverifiedObj.value]);
        }
        try{
            await unverified.save('unverified');
        } catch {}
        const membersCount = globals.get('membersCount');
        if(membersCount){
            const membersCountObj = {};
            membersCountObj[config.guild] = membersCount;
            globals.set('membersCount', membersCountObj);
        }
        const temporaryActions = globals.get('temporaryActions');
        if(temporaryActions){
            const temporaryActionsObj = {};
            temporaryActionsObj[config.guild] = temporaryActions;
            globals.set('temporaryActions', temporaryActionsObj);
        }
        const verificationRole = globals.get('verification-role');
        if(verificationRole){
            const verificationRoleObj = {};
            verificationRoleObj[config.guild] = verificationRole;
            globals.set('verification-role', verificationRoleObj);
        }
        const verificationChannel = globals.get('verification-channel');
        if(verificationChannel){
            const verificationChannelObj = {};
            verificationChannelObj[config.guild] = verificationChannel;
            globals.set('verification-channel', verificationChannelObj);
        }
        const ticketCount = globals.get('ticket_count');
        if(ticketCount){
            const ticketCountObj = {};
            ticketCountObj[config.guild] = ticketCount;
            globals.set('ticket_count', ticketCountObj);
        }
        const ticketCategories = globals.get('ticket-categories');
        if(ticketCategories){
            const ticketCategoriesObj = {};
            ticketCategoriesObj[config.guild] = ticketCategories;
            globals.set('ticket-categories', ticketCategoriesObj);
        }
        const antiFilterChannels = globals.get('anti-filter');
        if(antiFilterChannels){
            const newAntiFilterChannels = antiFilterChannels.map(c => {
                return {channel: c, guild: config.guild};
            });
            globals.set('anti-filter', newAntiFilterChannels);
        }
        const counting = globals.get('counting');
        if(counting){
            const countingObj = {};
            countingObj[config.guild] = counting;
            globals.set('counting', countingObj);
        }
        try{
            await globals.save('globals');
        } catch {}

        const suggestionsArr = suggestions.toReadableArray();
        for(var i = 0; i < suggestionsArr.length; i++){
            var suggestion = suggestionsArr[i];
            suggestion.value['guild'] = config.guild;
            suggestions.set(suggestion.key, suggestion.value);
        }
        try{
            await suggestions.save('suggestions');
        } catch {}

        delete config.guild;

        if(typeof config['embed-color'] === 'string'){
            delete config['embed-color'];
        }

        await fs.writeFile(path.join(__dirname, './config.json'), JSON.stringify(config, null, 2));
    }
})();
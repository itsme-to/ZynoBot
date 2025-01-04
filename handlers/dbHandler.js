const mysql = require('mysql2');
const { wait } = require('../functions.js');
const configHandler = require('./saveConfig.js');

let mysqlConnection;

let client;

const tableStructures = {
    'MySQL':{
        'tickets': [
            'guildId VARCHAR(200) NOT NULL',
            'memberId VARCHAR(200) NOT NULL',
            'channelId VARCHAR(200) NOT NULL',
            'ticketData LONGTEXT NOT NULL'
        ],
        'globals': [
            'globalsKey VARCHAR(400) NOT NULL',
            'globalsValue LONGTEXT NOT NULL',
            'guild VARCHAR(400)'
        ],
        'suggestions': [
            'messageId VARCHAR(200) NOT NULL',
            'suggestion VARCHAR(3000) NOT NULL',
            'userId VARCHAR(200) NOT NULL',
            'created VARCHAR(40) NOT NULL',
            'upvotes INT NOT NULL',
            'downvotes INT NOT NULL',
            'voters LONGTEXT DEFAULT (\'[]\') NOT NULL',
            'guildId VARCHAR(200) NOT NULL'
        ],
        'afk': [
            'userId VARCHAR(200) NOT NULL',
            'guildId VARCHAR(200) NOT NULL',
            'reason VARCHAR(1000) NOT NULL'
        ],
        'badwords': [
            'guildId VARCHAR(200) NOT NULL',
            'badword VARCHAR(400) NOT NULL'
        ],
        'economy': [
            'userId VARCHAR(200) NOT NULL',
            'guildId VARCHAR(200) NOT NULL',
            'bank VARCHAR(100) DEFAULT (0) NOT NULL',
            'cash VARCHAR(100) DEFAULT (0) NOT NULL',
            'timeouts VARCHAR(400) NOT NULL',
            'inventory LONGTEXT DEFAULT (\'[]\') NOT NULL'
        ],
        'giveaways': [
            'messageId VARCHAR(400) NOT NULL',
            'endTimestamp VARCHAR(400) NOT NULL',
            'winners INT DEFAULT (1) NOT NULL',
            'length VARCHAR(400) NOT NULL',
            'channelId VARCHAR(400) NOT NULL',
            'priceName VARCHAR(400) NOT NULL',
            'clientEndTimestamp VARCHAR(400) NOT NULL',
            'ended INT DEFAULT (0) NOT NULL',
            'organizor VARCHAR(400) NOT NULL',
            'requirements VARCHAR(400) NOT NULL'
        ],
        'giveawaysended': [
            'messageId VARCHAR(400) NOT NULL',
            'endTimestamp VARCHAR(400) NOT NULL',
            'winners INT DEFAULT (1) NOT NULL',
            'length VARCHAR(400) NOT NULL',
            'channelId VARCHAR(400) NOT NULL',
            'priceName VARCHAR(400) NOT NULL',
            'clientEndTimestamp VARCHAR(400) NOT NULL',
            'ended INT DEFAULT (0) NOT NULL',
            'organizor VARCHAR(400) NOT NULL',
            'requirements VARCHAR(400) NOT NULL',
            'removeAt VARCHAR(400) NOT NULL',
            'winnersArr VARCHAR(1000) NOT NULL'
        ],
        'polls': [
            'messageId VARCHAR(400) NOT NULL',
            'channelId VARCHAR(400) NOT NULL',
            'guildId VARCHAR(400) NOT NULL',
            'question VARCHAR(400) NOT NULL',
            'endTimestamp VARCHAR(200) NOT NULL',
            'clientEndTimestamp VARCHAR(200) NOT NULL',
            'startTimestamp VARCHAR(200) NOT NULL',
            'choicesRaw INT NOT NULL',
            'choices VARCHAR(2000) NOT NULL',
            'voters LONGTEXT NOT NULL'
        ],
        'reactrole': [
            'messageId VARCHAR(200) NOT NULL',
            'roleId VARCHAR(200) NOT NULL',
            'channelId VARCHAR(200) NOT NULL',
            'guildId VARCHAR(200) NOT NULL',
            'emoji VARCHAR(200) DEFAULT (NULL)',
            'reactType VARCHAR(200) NOT NULL',
            'button_id VARCHAR(200) DEFAULT (NULL)',
            'selectMenuOpt LONGTEXT DEFAULT (NULL)',
            'button VARCHAR(300) DEFAULT (NULL)',
            'msg VARCHAR(1000) NOT NULL',
            'customized INT DEFAULT (0) NOT NULL'
        ],
        'shop': [
            'name VARCHAR(200) NOT NULL',
            'description VARCHAR(2000) NOT NULL',
            'price VARCHAR(200) NOT NULL',
            'emoji VARCHAR(200) DEFAULT (NULL)',
            'stock VARCHAR(200) DEFAULT (\'Infinity\') NOT NULL',
            'role VARCHAR(200) DEFAULT (NULL)',
            'guildId VARCHAR(200) NOT NULL',
            'identifier VARCHAR(200) NOT NULL'
        ],
        'unverified': [
            'userId VARCHAR(200) NOT NULL',
            'guildId VARCHAR(200) NOT NULL',
            'code VARCHAR(200) NOT NULL',
            'messageId VARCHAR(200) DEFAULT (NULL)'
        ],
        'userinfo': [
            'userId VARCHAR(200) NOT NULL',
            'guildId VARCHAR(200) NOT NULL',
            'joins INT DEFAULT (1) NOT NULL',
            'kicks INT DEFAULT (0) NOT NULL',
            'bans INT DEFAULT (0) NOT NULL',
            'mutes INT DEFAULT (0) NOT NULL',
            'invites INT DEFAULT (0) NOT NULL',
            'inviteleaves INT DEFAULT (0) NOT NULL',
            'invitedBy VARCHAR(200) DEFAULT (NULL)'
        ],
        'warns': [
            'userId VARCHAR(200) NOT NULL',
            'guildId VARCHAR(200) NOT NULL',
            'warnedBy VARCHAR(200) NOT NULL',
            'reason LONGTEXT NOT NULL',
            'warnedAt VARCHAR(200) NOT NULL'
        ],
        'xp': [
            'userId VARCHAR(200) NOT NULL',
            'guildId VARCHAR(200) NOT NULL',
            'level INT DEFAULT (0) NOT NULL',
            'messages INT DEFAULT (0) NOT NULL',
            'xp INT DEFAULT (0) NOT NULL'
        ]
    }
};

const executeQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        const callback = (err, results, fields) => {
            if(err) return reject(err);
            else resolve({results: results, fields: fields});
        };
        let args = [];
        if(Array.isArray(params)) args.push(params.map(v => {
            if(typeof v === 'number'){
                return v.toLocaleString('fullwide', {useGrouping: false});
            } else return v;
        }));
        args.push(callback);
        mysqlConnection.query(query, ...args);
    });
};

async function handleTables(tables, type){
    if(type === "MySQL"){
        const missingTables = Object.keys(tableStructures[type]).filter(tN => tables.filter(t => t.Name.toLowerCase() === tN.toLowerCase()).length === 0);
        for(let i = 0; i < missingTables.length; i++){
            let table = missingTables[i];
            let structure = tableStructures[type][table];
            await executeQuery(`CREATE TABLE ${table.toLowerCase()}(
        id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
        ${structure.join(',\n    ')}
    );`);
        }

        const tableNames = Object.keys(tableStructures[type]).filter(t => missingTables.indexOf(t) < 0);
        for(let i = 0; i < tableNames.length; i++){
            let tableName = tableNames[i];
            let structure = tableStructures[type][tableName.toLowerCase()];
            let cuStructure = await executeQuery(`DESCRIBE ${tableName.toLowerCase()};`);
            let fields = cuStructure.results;
            for(let z = 0; z < fields.length; z++){
                let field = fields[z];
                if(field.Field === "id") continue;
                let correspondingField = structure.filter(s => s.split(" ")[0] === field.Field);
                if(correspondingField.length === 0){
                    try{
                        await executeQuery(`ALTER TABLE ${tableName.toLowerCase()} DROP COLUMN ${field.Field};`);
                    } catch (err){
                        console.log(err);
                        return;
                    }
                    continue;
                }
                correspondingField = correspondingField[0];
                if(field.Type !== correspondingField.split(" ")[1]){
                    try{
                        await executeQuery(`ALTER TABLE ${tableName.toLowerCase()} MODIFY ${field.Field} ${correspondingField.split(" ")[1]};`);
                    } catch (err){
                        console.log(err);
                        return;
                    }
                    continue;
                }
            }
            let missingColumns = structure.filter(c => {
                let columnName = c.split(" ")[0];
                const columnNames = fields.map(f => f.Field);
                return columnNames.indexOf(columnName) < 0;
            });
            for(let z = 0; z < missingColumns.length; z++){
                let missingColumn = missingColumns[z];
                try{
                    await executeQuery(`ALTER TABLE ${tableName.toLowerCase()} ADD COLUMN ${missingColumn};`);
                } catch (err){
                    console.log(err);
                    return;
                }
            }
        }
    }
    return;
}

async function importTableInfo(type){
    if(type === "MySQL"){
        let globalsTable = await executeQuery('SELECT * FROM globals');
        for(let i = 0; i < globalsTable.results.length; i++){
            let row = globalsTable.results[i];
            let importedKey = client.globals.get(row.globalsKey);
            let globalsVal = decodeURIComponent(row.globalsValue);
            if((globalsVal.indexOf("{") >= 0 && globalsVal.indexOf("}") >= 0) || (globalsVal.indexOf("[") >= 0 && globalsVal.indexOf("]") >= 0)){
                try{
                    globalsVal = JSON.parse(globalsVal);
                } catch {}
            }
            if(typeof row.guild === 'string'){
                if(!importedKey) importedKey = {};
                importedKey[row.guild] = globalsVal;
            } else {
                importedKey = globalsVal;
            }
            client.globals.set(row.globalsKey, importedKey);
        }
        let ticketsTable = await executeQuery('SELECT * FROM tickets');
        for(let i = 0; i < ticketsTable.results.length; i++){
            let ticketRow = ticketsTable.results[i];
            let currentVal = client.tickets.get(ticketRow.memberId) ?? [];
            let ticketData = decodeURIComponent(ticketRow.ticketData);
            try{
                ticketData = JSON.parse(ticketData);
            } catch {}
            currentVal.push(ticketData);
            client.tickets.set(ticketRow.memberId, currentVal);
        }
        let suggestionsTable = await executeQuery('SELECT * FROM suggestions');
        for(let i = 0; i < suggestionsTable.results.length; i++){
            let suggestionRow = suggestionsTable.results[i];
            let suggestion = decodeURIComponent(suggestionRow.suggestion);
            let voters = decodeURIComponent(suggestionRow.voters);
            try{
                voters = JSON.parse(voters);
            } catch {}
            client.suggestions.set(String(suggestionRow.messageId), {suggestion: suggestion, userId: String(suggestionRow.userId), created: parseInt(suggestionRow.created), upvotes: parseInt(suggestionRow.upvotes), downvotes: parseInt(suggestionRow.downvotes), voters: voters, guild: suggestionRow.guild});
        }
        let afkTable = await executeQuery('SELECT * FROM afk');
        for(let i = 0; i < afkTable.results.length; i++){
            let afkRow = afkTable.results[i];
            let currentVal = client.afk.get(afkRow.userId) ?? [];
            let afkReason = decodeURIComponent(afkRow.reason);
            currentVal.push({reason: afkReason, guild: afkRow.guildId});
            client.afk.set(afkRow.userId, currentVal);
        }
        let badwordsTable = await executeQuery('SELECT * FROM badwords');
        for(let i = 0; i < badwordsTable.results.length; i++){
            let badwordRow = badwordsTable.results[i];
            let currentVal = client.badwords.get(badwordRow.guildId) ?? [];
            currentVal.push(decodeURIComponent(badwordRow.badword));
            client.badwords.set(badwordRow.guildId, currentVal);
        }
        let economyTable = await executeQuery('SELECT * FROM economy');
        for(let i = 0; i < economyTable.results.length; i++){
            let economyRow = economyTable.results[i];
            let currentVal = client.economy.get(economyRow.userId) ?? [];
            let timeoutData = decodeURIComponent(economyRow.timeouts);
            try{
                timeoutData = JSON.parse(timeoutData);
            } catch {}
            currentVal.push({guild: economyRow.guildId, cash: parseInt(economyRow.cash), bank: parseInt(economyRow.bank), timeouts: timeoutData, inventory: JSON.parse(decodeURIComponent(economyRow.inventory ?? "[]"))});
            client.economy.set(economyRow.userId, currentVal);
        }
        let giveawaysTable = await executeQuery('SELECT * FROM giveaways');
        for(let i = 0; i < giveawaysTable.results.length; i++){
            let giveawayRow = giveawaysTable.results[i];
            let priceName = decodeURIComponent(giveawayRow.priceName);
            let requirements = decodeURIComponent(giveawayRow.requirements);
            try{
                requirements = JSON.parse(requirements);
            } catch {}
            client.giveaways.set(giveawayRow.messageId, {messageId: giveawayRow.messageId, endTimestamp: parseInt(giveawayRow.endTimestamp), winners: parseInt(giveawayRow.winners), length: parseInt(giveawayRow.length), channelId: giveawayRow.channelId, priceName: priceName, clientEndTimestamp: parseInt(giveawayRow.clientEndTimestamp), ended: !!parseInt(giveawayRow.ended), organizor: giveawayRow.organizor, requirements: requirements});
        }
        let giveawaysEndedTable = await executeQuery('SELECT * FROM giveawaysended');
        for(let i = 0; i < giveawaysEndedTable.results.length; i++){
            let giveawayRow = giveawaysEndedTable.results[i];
            let priceName = decodeURIComponent(giveawayRow.priceName);
            let requirements = decodeURIComponent(giveawayRow.requirements);
            try{
                requirements = JSON.parse(requirements);
            } catch {}
            let winnersArr = decodeURIComponent(giveawayRow.winnersArr);
            try{
                winnersArr = JSON.parse(winnersArr);
            } catch {}
            client.giveawaysEnded.set(giveawayRow.messageId, {messageId: giveawayRow.messageId, endTimestamp: parseInt(giveawayRow.endTimestamp), winners: parseInt(giveawayRow.winners), length: parseInt(giveawayRow.length), channelId: giveawayRow.channelId, priceName: priceName, clientEndTimestamp: parseInt(giveawayRow.clientEndTimestamp), ended: !!parseInt(giveawayRow.ended), organizor: giveawayRow.organizor, requirements: requirements, removeAt: parseInt(giveawayRow.removeAt), winnersArr: winnersArr});
        }
        let pollsTable = await executeQuery('SELECT * FROM polls');
        for(let i = 0; i < pollsTable.results.length; i++){
            let pollsRow = pollsTable.results[i];
            let question = decodeURIComponent(pollsRow.question);
            let choices = decodeURIComponent(pollsRow.choices);
            try{
                choices = JSON.parse(choices);
            } catch {}
            let voters = decodeURIComponent(pollsRow.voters);
            try{
                voters = JSON.parse(voters);
            } catch {}
            client.polls.set(pollsRow.messageId, {message: pollsRow.messageId, guild: pollsRow.guildId, channel: pollsRow.channelId, question: question, endTimestamp: parseInt(pollsRow.endTimestamp), clientEndTimestamp: parseInt(pollsRow.clientEndTimestamp), startTimestamp: parseInt(pollsRow.startTimestamp), choicesRaw: parseInt(pollsRow.choicesRaw), choices: choices, voters: voters});
        }
        let reactroleTable = await executeQuery('SELECT * FROM reactrole');
        for(let i = 0; i < reactroleTable.results.length; i++){
            let reactroleRow = reactroleTable.results[i];
            let cuVal = client.reactrole.get(reactroleRow.messageId) ?? [];
            let emoji = reactroleRow.emoji;
            if(emoji !== null){
                emoji = decodeURIComponent(emoji);
            }
            let button_id = reactroleRow.button_id;
            if(button_id !== null){
                button_id = decodeURIComponent(button_id);
            }
            let selectMenuOpt = reactroleRow.selectMenuOpt;
            if(selectMenuOpt !== null){
                selectMenuOpt = decodeURIComponent(selectMenuOpt);
                try{
                    selectMenuOpt = JSON.parse(selectMenuOpt);
                } catch {}
            }
            let button = reactroleRow.button;
            if(button !== null){
                button = decodeURIComponent(button);
                try{
                    button = JSON.parse(button);
                } catch {}
            }
            let msg = reactroleRow.msg;
            if(typeof msg === 'string'){
                msg = decodeURIComponent(msg);
            }
            cuVal.push({role: reactroleRow.roleId, emoji: emoji, button: button, type: reactroleRow.reactType, channel: reactroleRow.channelId, button_id: button_id, selectMenuOpt: selectMenuOpt, msg: msg, customized: !!parseInt(reactroleRow.customized), guild: reactroleRow.guild});
            client.reactrole.set(reactroleRow.messageId, cuVal);
        }
        let shopTable = await executeQuery('SELECT * FROM shop');
        for(let i = 0; i < shopTable.results.length; i++){
            let shopRow = shopTable.results[i];
            let cuVal = client.shop.get(shopRow.guildId) ?? [];
            cuVal.push({identifier: shopRow.identifier, price: parseInt(shopRow.price), name: decodeURIComponent(shopRow.name), description: decodeURIComponent(shopRow.description), stock: /^[0-9]*$/.test(shopRow.stock) ? parseInt(shopRow.stock) : 'Infinity', emoji: shopRow.emoji ? decodeURIComponent(shopRow.emoji) : null, role: shopRow.role ? shopRow.role : null});
            client.shop.set(shopRow.guildId, cuVal);
        }
        let unverifiedTable = await executeQuery('SELECT * FROM unverified');
        for(let i = 0; i < unverifiedTable.results.length; i++){
            let unverifiedRow = unverifiedTable.results[i];
            let cuVal = client.unverified.get(unverifiedRow.userId) ?? [];
            cuVal.push({code: unverifiedRow.code, messageId: unverifiedRow.messageId, guild: unverifiedRow.guildId});
            client.unverified.set(unverifiedRow.userId, cuVal);
        }
        let userinfoTable = await executeQuery('SELECT * FROM userinfo');
        for(let i = 0; i < userinfoTable.results.length; i++){
            let userinfoRow = userinfoTable.results[i];
            let cuVal = client.userinfo.get(userinfoRow.userId) ?? [];
            cuVal.push({joins: parseInt(userinfoRow.joins), kicks: parseInt(userinfoRow.kicks), bans: parseInt(userinfoRow.bans), mutes: parseInt(userinfoRow.mutes), invites: parseInt(userinfoRow.invites), inviteleaves: parseInt(userinfoRow.inviteleaves), invitedBy: userinfoRow.invitedBy, guild: userinfoRow.guildId});
            client.userinfo.set(userinfoRow.userId, cuVal);
        }
        let warnsTable = await executeQuery('SELECT * FROM warns');
        for(let i = 0; i < warnsTable.results.length; i++){
            let warnsRow = warnsTable.results[i];
            let cuVal = client.warns.get(warnsRow.userId) ?? [];
            cuVal.push({warnedBy: warnsRow.warnedBy, reason: decodeURIComponent(warnsRow.reason), warnedAt: parseInt(warnsRow.warnedAt), guild: warnsRow.guildId});
            client.warns.set(warnsRow.userId, cuVal);
        }
        let xpTable = await executeQuery('SELECT * FROM xp');
        for(let i = 0; i < xpTable.results.length; i++){
            let xpRow = xpTable.results[i];
            let cuVal = client.xp.get(xpRow.userId) ?? [];
            cuVal.push({level: parseInt(xpRow.level), xp: parseInt(xpRow.xp), messages: parseInt(xpRow.messages), guild: xpRow.guildId});
            client.xp.set(xpRow.userId, cuVal);
        }
    }
    return;
}

function start(_client){
    return new Promise(async (resolve, reject) => {
        client = _client;
        if(client.config.database.type.toLowerCase() === 'valuesaver'){           
            await client.suggestions.import(`suggestions`);
            await client.globals.import(`globals`);
            await client.tickets.import(`tickets`);
            await client.warns.import(`warns`);
            await client.giveaways.import(`giveaways`);
            await client.giveawaysEnded.import(`giveawaysEnded`);
            await client.xp.import(`xp`);
            await client.economy.import(`economy`);
            await client.badwords.import(`badwords`);
            await client.userinfo.import(`userinfo`);
            await client.unverified.import(`unverified`);
            await client.reactrole.import(`reactrole`);
            await client.afk.import(`afk`);
            await client.polls.import(`polls`);
            await client.shop.import(`shop`);
            resolve();
        } else if(client.config.database.type.toLowerCase() === 'mysql'){
            mysqlConnection = mysql.createPool({
                host: client.config.database.mysql.host,
                user: client.config.database.mysql.user,
                password: client.config.database.mysql.password,
                database: client.config.database.mysql.database,
                connectTimeout: 6e4,
                waitForConnections: true,
                connectionLimit: 20
            });

            try{
                console.log(`Validating database...`);
                let tables = await executeQuery('SHOW TABLE STATUS;');
                await handleTables(tables.results, 'MySQL');
                console.log(`Database validation completed`);
                await importTableInfo('MySQL');
                console.log(`Imported database values`);
            } catch (err){
                console.log(`Error while getting table information:`, err);
                return;
            }

            resolve();
        }
    });
}

async function reconnect(){
    mysqlConnection = mysql.createPool({
        host: client.config.database.mysql.host,
        user: client.config.database.mysql.user,
        password: client.config.database.mysql.password,
        database: client.config.database.mysql.database,
        connectTimeout: 1e4,
        waitForConnections: true,
        connectionLimit: 20
    });

    let tables = await executeQuery('SHOW TABLE STATUS;');
    await handleTables(tables.results, 'MySQL');
}

function encodeArgs(args, soft = false){
    if(typeof args === 'object' && soft === false){
        try{
            args = JSON.stringify(args);
        } catch {}
    }
    args = encodeURIComponent(args);
    return args;
}

async function setValue(table, args, keys){
    let queries = [], queriesArgs = [];
    const columnValues = Object.values(keys);
    if(table === 'globals'){
        let valExists = client.globals.get(columnValues[0]) !== undefined;
        if(typeof args === 'object'){
            if(!Array.isArray(args) && args !== null){
                let globalKeys = Object.keys(args);
                if(globalKeys.filter(k => /^[0-9]{10,22}$/.test(k)).length === globalKeys.length){
                    let cuVal = client.globals.get(columnValues[0]) ?? {};
                    let cuValKeys = Object.keys(cuVal);
                    let missingKeys = cuValKeys.filter(k => globalKeys.indexOf(k) < 0);
                    for(let i = 0; i < globalKeys.length; i++){
                        if(Object.keys(cuVal).indexOf(globalKeys[i]) < 0){
                            queries.push("INSERT INTO globals (globalsKey, globalsValue, guild) VALUES (?, ?, ?)");
                            queriesArgs.push([columnValues[0], encodeArgs(args[globalKeys[i]]), globalKeys[i]]);
                        } else {
                            if(cuVal[globalKeys[i]] === args[globalKeys[i]]) continue;
                            queries.push("UPDATE globals SET globalsValue = ? WHERE globalsKey = ? AND guild = ?");
                            queriesArgs.push([encodeArgs(args[globalKeys[i]]), columnValues[0], globalKeys[i]]);
                        }
                    }
                    for(let i = 0; i < missingKeys.length; i++){
                        queries.push("DELETE FROM globals WHERE globalsKey = ? AND guild = ?");
                        queriesArgs.push([columnValues[0], missingKeys[i]]);
                    }
                } else {
                    if(!valExists){
                        queries.push("INSERT INTO globals (globalsKey, globalsValue) VALUES (?, ?)");
                        queriesArgs.push([columnValues[0], encodeArgs(args)]);
                    } else {
                        queries.push("UPDATE globals SET globalsValue = ? WHERE globalsKey = ?");
                        queriesArgs.push([encodeArgs(args), columnValues[0]]);
                    }
                }
            }
        } else {
            if(valExists){
                queries.push("UPDATE globals SET globalsValue = ? WHERE globalsKey = ?");
                queriesArgs.push([encodeArgs(args), columnValues[0]]);
            } else {
                queries.push("INSERT INTO globals (globalsKey, globalsValue) VALUES (?, ?)");
                queriesArgs.push([columnValues[0], encodeArgs(args)]);
            }
        }
        client.globals.set(columnValues[0], args);
        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.globals.save(`globals`);
            } catch {}
        }
    } else if(table === 'tickets'){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let valExists = client.tickets.get(keys.memberId) !== undefined;
        if(valExists){
            let cuVal = client.tickets.get(keys.memberId);
            if(!Array.isArray(cuVal)){
                cuVal = [cuVal];
            }
            let getCu = cuVal.filter(t => t.channel === keys.channelId && t.guild === keys.guildId);
            if(getCu.length > 0){
                let indexCu = cuVal.indexOf(getCu[0]);
                if(indexCu >= 0) cuVal.splice(indexCu, 1);
                queries.push("UPDATE tickets SET ticketData = ? WHERE guildId = ? AND memberId = ? AND channelId = ?");
                queriesArgs.push([encodeArgs(args), keys.guildId, keys.memberId, keys.channelId]);
            } else {
                queries.push("INSERT INTO tickets (ticketData, guildId, memberId, channelId) VALUES (?, ?, ?, ?)");
                queriesArgs.push([encodeArgs(args), keys.guildId, keys.memberId, keys.channelId]);
            }
            cuVal.push(args);
            client.tickets.set(keys.memberId, cuVal);
        } else {
            queries.push("INSERT INTO tickets (ticketData, guildId, memberId, channelId) VALUES (?, ?, ?, ?)");
            queriesArgs.push([encodeArgs(args), keys.guildId, keys.memberId, keys.channelId]);
            client.tickets.set(keys.memberId, [args]);
        }
        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.tickets.save(`tickets`);
            } catch {}
        }
    } else if(table === "suggestions"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let valExists = client.suggestions.get(keys.messageId) !== undefined;
        if(valExists){
            queries.push("UPDATE suggestions SET suggestion = ?, userId = ?, created = ?, upvotes = ?, downvotes = ?, voters = ? WHERE messageId = ? AND guildId = ?");
            queriesArgs.push([encodeArgs(args.suggestion, true), args.userId, args.created, args.upvotes, args.downvotes, encodeArgs(args.voters), keys.messageId, keys.guildId]);
        } else {
            queries.push("INSERT INTO suggestions (suggestion, userId, created, upvotes, downvotes, voters, messageId, guildId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            queriesArgs.push([encodeArgs(args.suggestion, true), args.userId, args.created, args.upvotes, args.downvotes, encodeArgs(args.voters), keys.messageId, keys.guildId]);
        }
        client.suggestions.set(keys.messageId, args);
        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.suggestions.save(`suggestions`);
            } catch {}
        }
    } else if(table === "afk"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let memberAfks = client.afk.get(keys.memberId) ?? [];
        let valExists = memberAfks.filter(a => a.guild === args.guild).length > 0;
        if(valExists){
            queries.push("UPDATE afk SET reason = ? WHERE userId = ? AND guildId = ?");
            queriesArgs.push([encodeArgs(args.reason, true), keys.memberId, args.guild]);
            let currentVal = memberAfks.filter(a => a.guild === args.guild)[0];
            if(currentVal){
                let cuIndex = memberAfks.indexOf(currentVal);
                if(cuIndex >= 0) memberAfks.splice(cuIndex, 1);
            }
        } else {
            queries.push("INSERT INTO afk (userId, guildId, reason) VALUES (?, ?, ?)");
            queriesArgs.push([keys.memberId, args.guild, encodeArgs(args.reason, true)]);
        }
        memberAfks.push(args);
        client.afk.set(keys.memberId, memberAfks);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.afk.save(`afk`);
            } catch {}
        }
    } else if(table === "badwords"){
        if(typeof args !== 'string') return;
        let badwords = client.badwords.get(keys.guildId) ?? [];
        if(badwords.indexOf(args.toLowerCase()) >= 0) return;

        badwords.push(args.toLowerCase());
        client.badwords.set(keys.guildId, badwords);

        queries.push("INSERT INTO badwords (badword, guildId) VALUES (?, ?)");
        queriesArgs.push([encodeArgs(args, true), keys.guildId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.badwords.save(`badwords`);
            } catch {}
        }
    } else if(table === "economy"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let userEconomy = client.economy.get(keys.memberId) ?? [];
        let exists = userEconomy.filter(e => e.guild === keys.guildId);
        if(exists.length > 0){
            let existingIndex = userEconomy.indexOf(exists[0]);
            if(existingIndex >= 0) userEconomy.splice(existingIndex, 1);
            queries.push("UPDATE economy SET bank = ?, cash = ?, timeouts = ?, inventory = ? WHERE userId = ? AND guildId = ?");
            queriesArgs.push([args.bank, args.cash, encodeArgs(args.timeouts), encodeArgs(args.inventory), keys.memberId, keys.guildId]);
        } else {
            queries.push("INSERT INTO economy (userId, guildId, bank, cash, timeouts, inventory) VALUES (?, ?, ?, ?, ?, ?)");
            queriesArgs.push([keys.memberId, keys.guildId, args.bank, args.cash, encodeArgs(args.timeouts), encodeArgs(args.inventory)]);
        }
        userEconomy.push(args);

        client.economy.set(keys.memberId, userEconomy);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.economy.save(`economy`);
            } catch {}
        }
    } else if(table === "giveaways"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let exists = client.giveaways.get(keys.messageId);
        if(exists){
            queries.push("UPDATE giveaways SET endTimestamp = ?, winners = ?, length = ?, channelId = ?, priceName = ?, clientEndTimestamp = ?, ended = ?, organizor = ?, requirements = ? WHERE messageId = ?");
            queriesArgs.push([args.endTimestamp, args.winners, args.length, args.channelId, encodeArgs(args.priceName, true), args.clientEndTimestamp, args.ended ? 1 : 0, args.organizor, encodeArgs(args.requirements), keys.messageId]);
        } else {
            queries.push("INSERT INTO giveaways (messageId, endTimestamp, winners, length, channelId, priceName, clientEndTimestamp, ended, organizor, requirements) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            queriesArgs.push([keys.messageId, args.endTimestamp, args.winners, args.length, args.channelId, encodeArgs(args.priceName, true), args.clientEndTimestamp, args.ended ? 1 : 0, args.organizor, encodeArgs(args.requirements)]);

        }
        client.giveaways.set(keys.messageId, args);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.giveaways.save(`giveaways`);
            } catch {}
        }
    } else if(table === "giveawaysEnded"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let exists = client.giveawaysEnded.get(keys.messageId);
        if(exists){
            queries.push("UPDATE giveawaysended SET endTimestamp = ?, winners = ?, length = ?, channelId = ?, priceName = ?, clientEndTimestamp = ?, ended = ?, organizor = ?, requirements = ?, removeAt = ?, winnersArr = ? WHERE messageId = ?");
            queriesArgs.push([args.endTimestamp, args.winners, args.length, args.channelId, encodeArgs(args.priceName, true), args.clientEndTimestamp, args.ended ? 1 : 0, args.organizor, encodeArgs(args.requirements), args.removeAt, encodeArgs(args.winnersArr), keys.messageId]);
        } else {
            queries.push("INSERT INTO giveawaysended (messageId, endTimestamp, winners, length, channelId, priceName, clientEndTimestamp, ended, organizor, requirements, removeAt, winnersArr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            queriesArgs.push([keys.messageId, args.endTimestamp, args.winners, args.length, args.channelId, encodeArgs(args.priceName, true), args.clientEndTimestamp, args.ended ? 1 : 0, args.organizor, encodeArgs(args.requirements), args.removeAt, encodeArgs(args.winnersArr)]);

        }
        client.giveawaysEnded.set(keys.messageId, args);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.giveawaysEnded.save(`giveawaysEnded`);
            } catch {}
        }
    } else if(table === "polls"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let exists = client.polls.get(keys.messageId);

        if(exists){
            queries.push("UPDATE polls SET question = ?, endTimestamp = ?, clientEndTimestamp = ?, startTimestamp = ?, choicesRaw = ?, choices = ?, voters = ? WHERE messageId = ? AND channelId = ? AND guildId = ?");
            queriesArgs.push([encodeArgs(args.question, true), args.endTimestamp, args.clientEndTimestamp, args.startTimestamp, args.choicesRaw, encodeArgs(args.choices), encodeArgs(args.voters), keys.messageId, keys.channelId, keys.guildId]);
        } else {
            queries.push("INSERT INTO polls (messageId, channelId, guildId, question, endTimestamp, clientEndTimestamp, startTimestamp, choicesRaw, choices, voters) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            queriesArgs.push([keys.messageId, keys.channelId, keys.guildId, encodeArgs(args.question, true), args.endTimestamp, args.clientEndTimestamp, args.startTimestamp, args.choicesRaw, encodeArgs(args.choices), encodeArgs(args.voters)]);
        }

        client.polls.set(keys.messageId, args);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.polls.save(`polls`);
            } catch {}
        }
    } else if(table === "reactrole"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let reactrolemsg = client.reactrole.get(keys.messageId) ?? [];
        let reactrole = reactrolemsg.filter(r => r.role === keys.roleId);
        
        if(reactrole.length > 0){
            let index = reactrolemsg.indexOf(reactrole[0]);
            if(index >= 0) reactrolemsg.splice(index, 1);
            queries.push("UPDATE reactrole SET emoji = ?, reactType = ?, button_id = ?, selectMenuOpt = ?, button = ?, msg = ?, customized = ? WHERE messageId = ? AND channelId = ? AND roleId = ? AND guildId = ?");
            queriesArgs.push([args.roleId, args.emoji ? encodeArgs(args.emoji, true) : null, args.type, args.button_id ? encodeArgs(args.button_id, true) : null, args.selectMenuOpt ? encodeArgs(args.selectMenuOpt) : null, args.button ? encodeArgs(args.button) : null, encodeArgs(args.msg, true), args.customized ? 1 : 0, keys.messageId, keys.channelId, keys.roleId, keys.guildId]);
        } else {
            queries.push("INSERT INTO reactrole (messageId, roleId, channelId, guildId, emoji, reactType, button_id, selectMenuOpt, button, msg, customized) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            queriesArgs.push([keys.messageId, keys.roleId, keys.channelId, keys.guildId, args.emoji ? encodeArgs(args.emoji, true) : null, args.type, args.button_id ? encodeArgs(args.button_id, true) : null, args.selectMenuOpt ? encodeArgs(args.selectMenuOpt) : null, args.button ? encodeArgs(args.button) : null, encodeArgs(args.msg, true), args.customized ? 1 : 0]);
        }
        reactrolemsg.push(args);

        client.reactrole.set(keys.messageId, reactrolemsg);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.reactrole.save(`reactrole`);
            } catch {}
        }
    } else if(table === "shop"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let shop = client.shop.get(keys.guildId) ?? [];
        let shopItem = shop.filter(s => s.identifier === keys.identifier);

        if(shopItem.length > 0){
            let shopItemIndex = shop.indexOf(shopItem[0]);
            if(shopItemIndex >= 0) shop.splice(shopItemIndex, 1);

            queries.push("UPDATE shop SET name = ?, description = ?, price = ?, emoji = ?, stock = ?, role = ? WHERE identifier = ? AND guildId = ?");
            queriesArgs.push([encodeArgs(args.name, true), encodeArgs(args.description, true), args.price, encodeArgs(args.emoji, true), args.stock, args.role, keys.identifier, keys.guildId]);
        } else {
            queries.push("INSERT INTO shop (name, description, price, emoji, stock, role, identifier, guildId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            queriesArgs.push([encodeArgs(args.name, true), encodeArgs(args.description, true), args.price, encodeArgs(args.emoji, true), args.stock, args.role, keys.identifier, keys.guildId]);
        }

        shop.push(args);
        client.shop.set(keys.guildId, shop);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.shop.save(`shop`);
            } catch {}
        }
    } else if(table === "unverified"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let unverified = client.unverified.get(keys.memberId) ?? [];
        let guildUnverified = unverified.filter(u => u.guild === keys.guildId);

        if(guildUnverified.length > 0){
            let guildUnverifiedIndex = unverified.indexOf(guildUnverified[0]);
            if(guildUnverifiedIndex >= 0) unverified.splice(guildUnverifiedIndex, 1);

            queries.push("UPDATE unverified SET code = ?, messageId = ? WHERE userId = ? AND guildId = ?");
            queriesArgs.push([args.code, args.messageId, keys.memberId, keys.guildId]);
        } else {
            queries.push("INSERT INTO unverified (userId, guildId, code, messageId) VALUES (?, ?, ?, ?)");
            queriesArgs.push([keys.memberId, keys.guildId, args.code, args.messageId]);
        }

        unverified.push(args);
        client.unverified.set(keys.memberId, unverified);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.unverified.save(`unverified`);
            } catch {}
        }
    } else if(table === "userinfo"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let userinfo = client.userinfo.get(keys.memberId) ?? [];
        let cuVal = userinfo.filter(u => u.guild === keys.guildId);
        if(cuVal.length > 0){
            let cuIndex = userinfo.indexOf(cuVal[0]);
            if(cuIndex >= 0) userinfo.splice(cuIndex, 1);
            queries.push("UPDATE userinfo SET joins = ?, bans = ?, kicks = ?, mutes = ?, invites = ?, inviteleaves = ?, invitedBy = ? WHERE userId = ? AND guildId = ?");
            queriesArgs.push([args.joins, args.bans, args.kicks, args.mutes, args.invites, args.inviteleaves, args.invitedBy, keys.memberId, keys.guildId]);
        } else {
            queries.push("INSERT INTO userinfo (userId, guildId, joins, bans, kicks, mutes, invites, inviteleaves, invitedBy) VALUES (?, ?, ?,  ?, ?, ?, ?, ?, ?)");
            queriesArgs.push([keys.memberId, keys.guildId, args.joins, args.bans, args.kicks, args.mutes, args.invites, args.inviteleaves, args.invitedBy]);
        }
        userinfo.push(args);
        client.userinfo.set(keys.memberId, userinfo);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.userinfo.save(`userinfo`);
            } catch {}
        }
    } else if(table === "warns"){
        if(typeof args !== 'object' || Array.isArray(args) || args === null) return;
        let warns = client.warns.get(keys.memberId) ?? [];
        warns.push(args);
        queries.push("INSERT INTO warns (userId, guildId, warnedBy, reason, warnedAt) VALUES (?, ?, ?, ?, ?)");
        queriesArgs.push([keys.memberId, keys.guildId, args.warnedBy, encodeArgs(args.reason, true), args.warnedAt]);
        client.warns.set(keys.memberId, warns);
        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.warns.save(`warns`);
            } catch {}
        }
    }
    if(client.config.database.type.toLowerCase() === "mysql" && queries.length > 0){
        for(let i = 0; i < queries.length; i++){
            await executeQuery(queries[i], (Array.isArray(queriesArgs[i]) ? queriesArgs[i] : undefined));
            await wait(4e2);
        }
    }
}

async function deleteValue(table, args, keys){
    let queries = [], queriesArgs = [];
    if(table === "globals"){
        let cuVal = client.globals.get(keys.globalsKey);
        if(!cuVal) return;
        const valKeys = Object.keys(cuVal);
        if(typeof cuVal === 'object' && valKeys.filter(k => k === keys.guildId).length > 0){
            delete cuVal[keys.guild];
            client.globals.set(keys.globalsKey, cuVal);
            queries.push("DELETE FROM globals WHERE globalsKey = ? AND guildId = ?");
            queriesArgs.push([keys.globalsKey, keys.guildId]);
        } else {
            queries.push("DELETE FROM globals WHERE globalsKey = ?");
            queriesArgs.push([keys.globalsKey]);
            client.globals.delete(keys.globalsKey);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.globals.save(`globals`);
            } catch {}
        }
    } else if(table === "tickets"){
        let cuVal = client.tickets.get(keys.memberId);
        if(!cuVal) return;
        let argsVal = cuVal.filter(t => t.guild === keys.guildId && t.channel === keys.channelId);
        if(!argsVal[0]) return;
        let index = cuVal.indexOf(argsVal[0]);
        if(index >= 0) cuVal.splice(index, 1);
        if(cuVal.length > 0) client.tickets.set(keys.memberId, cuVal);
        else client.tickets.delete(keys.memberId);

        queries.push("DELETE FROM tickets WHERE guildId = ? AND memberId = ? AND channelId = ?");
        queriesArgs.push([keys.guildId, keys.memberId, keys.channelId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.tickets.save(`tickets`);
            } catch {}
        }
    } else if(table === "suggestions"){
        let cuVal = client.suggestions.get(keys.messageId);
        if(!cuVal) return;
        queries.push("DELETE FROM suggestions WHERE messageId = ? AND guildId = ?");
        queriesArgs.push([keys.messageId, keys.guildId]);
        client.suggestions.delete(keys.messageId);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.suggestions.save(`suggestions`);
            } catch {}
        }
    } else if(table === "afk"){
        let cuVal = client.afk.get(keys.memberId);
        if(!cuVal) return;
        let argsVal = cuVal.filter(t => t.guild === args.guild);
        if(!argsVal[0]) return;
        let index = cuVal.indexOf(argsVal[0]);
        if(index >= 0) cuVal.splice(index, 1);
        if(cuVal.length > 0) client.afk.set(keys.memberId, cuVal);
        else client.afk.delete(keys.memberId);

        queries.push("DELETE FROM afk WHERE guildId = ? AND userId = ?");
        queriesArgs.push([args.guild, keys.memberId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.afk.save(`afk`);
            } catch {}
        }
    } else if(table === "badwords"){
        let badwords = client.badwords.get(keys.guildId);
        if(!badwords) return;
        let index = badwords.indexOf(args.toLowerCase());
        if(index >= 0) badwords.splice(index, 1);
        if(badwords.length > 0) client.badwords.set(keys.guildId, badwords);
        else client.badwords.delete(keys.guildId);

        queries.push("DELETE FROM badwords WHERE badword = ? AND guildId = ?");
        queriesArgs.push([encodeArgs(args, true), keys.guildId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.badwords.save(`badwords`);
            } catch {}
        }
    } else if(table === "economy"){
        let economy = client.economy.get(keys.memberId);
        if(!economy) return;
        let getGuild = economy.filter(e => e.guild === keys.guildId);
        if(getGuild.length < 1) return;
        let guildIndex = economy.indexOf(getGuild[0]);
        if(guildIndex >= 0) economy.splice(guildIndex, 1);
        if(economy.length > 0) client.economy.set(keys.memberId, economy);
        else client.economy.delete(keys.memberId);

        queries.push("DELETE FROM economy WHERE userId = ? AND memberId = ?");
        queriesArgs.push([keys.memberId, keys.guildId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.economy.save(`economy`);
            } catch {}
        }
    } else if(table === "giveaways"){
        let giveaway = client.giveaways.get(keys.messageId);
        if(!giveaway) return;
        client.giveaways.delete(keys.messageId);

        queries.push("DELETE FROM giveaways WHERE messageId = ?");
        queriesArgs.push([keys.messageId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.giveaways.save(`giveaways`);
            } catch {}
        }
    } else if(table === "giveawaysEnded"){
        let giveaway = client.giveawaysEnded.get(keys.messageId);
        if(!giveaway) return;
        client.giveawaysEnded.delete(keys.messageId);

        queries.push("DELETE FROM giveawaysended WHERE messageId = ?");
        queriesArgs.push([keys.messageId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.giveawaysEnded.save(`giveaways`);
            } catch {}
        }
    } else if(table === "polls"){
        let poll = client.polls.get(keys.messageId);
        if(!poll) return;
        client.polls.delete(keys.messageId);

        queries.push("DELETE FROM polls WHERE messageId = ? AND guildId = ? AND channelId = ?");
        queriesArgs.push([keys.messageId, keys.guildId, keys.channelId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.polls.save(`polls`);
            } catch {}
        }
    } else if(table === "reactrole"){
        let reactrole = client.reactrole.get(keys.messageId);
        if(!reactrole) return;

        if(typeof keys.roleId === 'string'){
            let findRole = reactrole.filter(r => r.role === keys.roleId);
            if(findRole.length < 1) return;
            let indexRole = reactrole.indexOf(findRole[0]);
            if(indexRole >= 0) reactrole.splice(indexRole, 1);
            if(reactrole.length > 0) client.reactrole.set(keys.messageId, reactrole);
            else client.reactrole.delete(keys.messageId);
            queries.push("DELETE FROM reactrole WHERE roleId = ? AND messageId = ? AND channelId = ? AND guildId = ?");
            queriesArgs.push([keys.roleId, keys.messageId, keys.channelId, keys.guildId]);
        } else {
            client.reactrole.delete(keys.messageId);
            queries.push("DELETE FROM reactrole WHERE messageId = ? AND channelId = ? AND guildId = ?");
            queriesArgs.push([keys.messageId, keys.channelId, keys.guildId]);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.reactrole.save(`reactrole`);
            } catch {}
        }
    } else if(table === "shop"){
        let shop = client.shop.get(keys.guildId);
        if(!shop) return;
        let shopItem = shop.filter(u => u.identifier === keys.identifier);
        if(shopItem.length < 1) return;
        let shopItemIndex = shop.indexOf(shopItem[0]);
        if(shopItemIndex >= 0) shop.splice(shopItemIndex, 1);
        if(shop.length === 0) client.shop.delete(keys.guildId);
        else client.shop.set(keys.guildId, shop);
        queries.push("DELETE FROM shop WHERE identifier = ? AND guildId = ?");
        queriesArgs.push([keys.identifier, keys.guildId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.shop.save(`shop`);
            } catch {}
        }
    } else if(table === "unverified"){
        let unverified = client.unverified.get(keys.memberId);
        if(!unverified) return;
        let guildUnverified = unverified.filter(u => u.guild === keys.guildId);
        if(guildUnverified.length < 1) return;
        let guildUnverifiedIndex = unverified.indexOf(guildUnverified[0]);
        if(guildUnverifiedIndex >= 0) unverified.splice(guildUnverifiedIndex, 1);
        if(unverified.length === 0) client.unverified.delete(keys.memberId);
        else client.unverified.set(keys.memberId, unverified);
        queries.push("DELETE FROM unverified WHERE userId = ? AND guildId = ?");
        queriesArgs.push([keys.memberId, keys.guildId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.unverified.save(`unverified`);
            } catch {}
        }
    } else if(table === "userinfo"){
        let userinfo = client.userinfo.get(keys.memberId);
        if(!userinfo) return;
        let guildUserinfo = userinfo.filter(u => u.guild === keys.guildId);
        if(guildUserinfo.length < 1) return;
        let guildUserinfoIndex = userinfo.indexOf(guildUserinfo[0]);
        if(guildUserinfoIndex >= 0) userinfo.splice(guildUserinfoIndex, 1);
        if(userinfo.length === 0) client.userinfo.delete(keys.memberId);
        else client.userinfo.set(keys.memberId, userinfo);
        queries.push("DELETE FROM userinfo WHERE userId = ? AND guildId = ?");
        queriesArgs.push([keys.memberId, keys.guildId]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.userinfo.save(`userinfo`);
            } catch {}
        }
    } else if(table === "warns"){
        let warns = client.warns.get(keys.memberId);
        if(!warns) return;
        let guildWarn = warns.filter(u => (u.guild ?? args.guild) === args.guild && u.warnedBy === args.warnedBy && u.warnedAt === args.warnedAt && u.reason === args.reason);
        if(guildWarn.length < 1) return;
        let guildWarnIndex = warns.indexOf(guildWarn[0]);
        if(guildWarnIndex >= 0) warns.splice(guildWarnIndex, 1);
        if(warns.length > 0) client.warns.set(keys.memberId, warns);
        else client.warns.delete(keys.memberId);
        queries.push("DELETE FROM warns WHERE userId = ? AND guildId = ? AND reason = ? AND warnedBy = ? AND warnedAt = ?");
        queriesArgs.push([keys.memberId, keys.guildId, encodeArgs(args.reason, true), args.warnedBy, args.warnedAt]);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.warns.save(`warns`);
            } catch {}
        }
    }

    if(client.config.database.type.toLowerCase() === "mysql" && queries.length > 0){
        for(let i = 0; i < queries.length; i++){
            await executeQuery(queries[i], (Array.isArray(queriesArgs[i]) ? queriesArgs[i] : undefined));
            await wait(4e2);
        }
    }
}

async function forceDeleteGuild(table, guildId){
    let queries = [], queriesArgs = [];
    if(table === "tickets"){
        queries.push("DELETE FROM tickets WHERE guildId = ?");
        queriesArgs.push([guildId]);
        let guildTickets = client.tickets.toReadableArray().filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(_t => _t.guild === guildId).length > 0;
            } else return false;
        });
        for(let i = 0; i < guildTickets.length; i++){
            let userTickets = client.tickets.get(guildTickets[i].key);
            let guildTicket = userTickets.filter(a => a.guild === guildId);
            if(guildTicket.length < 1) continue;
            let guildIndex = userTickets.indexOf(guildTicket[0]);
            if(guildIndex >= 0) userTickets.splice(guildIndex, 1);
            client.tickets.set(guildTickets[i].key, userTickets);
        }
        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.tickets.save(`tickets`);
            } catch {}
        }
    } else if(table === "globals"){
        queries.push("DELETE FROM tickets WHERE guild = ?");
        queriesArgs.push([guildId]);
    } else if(table === "afk"){
        queries.push("DELETE FROM afk WHERE guildId = ?");
        queriesArgs.push([guildId]);
        let afks = client.afk.toReadableArray();
        let active = afks.filter(a => a.value.filter(_a => _a.guild === guildId).length > 0);
        for(let i = 0; i < active.length; i++){
            let userAfks = client.afk.get(active[i].key);
            let guildAfk = userAfks.filter(a => a.guild === guildId);
            if(guildAfk.length < 1) continue;
            let guildIndex = userAfks.indexOf(guildAfk[0]);
            if(guildIndex >= 0) userAfks.splice(guildIndex, 1);
            client.afk.set(active[i].key, userAfks);
        }
        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.afk.save(`afk`);
            } catch {}
        }
    } else if(table === "badwords"){
        queries.push("DELETE FROM badwords WHERE guildId = ?");
        queriesArgs.push([guildId]);
        client.badwords.delete(guildId);
        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.badwords.save(`badwords`);
            } catch {}
        }
    } else if(table === "economy"){
        queries.push("DELETE FROM economy WHERE guildId = ?");
        queriesArgs.push([guildId]);
        let economy = client.economy.toReadableArray().filter(t => {
            if(Array.isArray(t.value)){
                return t.value.filter(_t => _t.guild === guildId).length > 0;
            } else return false;
        });
        for(let i = 0; i < economy.length; i++){
            let userEconomy = client.economy.get(economy[i].key);
            let guildEconomy = userEconomy.filter(a => a.guild === guildId);
            if(guildEconomy.length < 1) continue;
            let guildIndex = userEconomy.indexOf(guildEconomy[0]);
            if(guildIndex >= 0) userEconomy.splice(guildIndex, 1);
            client.economy.set(economy[i].key, userEconomy);
        }
        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.economy.save(`economy`);
            } catch {}
        }
    } else if(table === "shop"){
        queries.push("DELETE FROM shop WHERE guildId = ?");
        queriesArgs.push([guildId]);
        client.shop.delete(guildId);

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.unverified.save(`unverified`);
            } catch {}
        }
    } else if(table === "unverified"){
        queries.push("DELETE FROM unverified WHERE guildId = ?");
        queriesArgs.push([guildId]);

        const unverified = client.unverified.toReadableArray().filter(u => u.value.filter(_u => _u.guild === guildId).length > 0);
        for(let i = 0; i < unverified.length; i++){
            let getUnverified = unverified[i];
            let guildUnverified = getUnverified.value.filter(u => u.guild === guildId);
            if(guildUnverified.length < 1) continue;
            let unverifiedIndex = getUnverified.value.indexOf(guildUnverified[0]);
            if(unverifiedIndex >= 0) getUnverified.value.splice(unverifiedIndex, 1);
            client.unverified.set(getUnverified.key, getUnverified.value);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.unverified.save(`unverified`);
            } catch {}
        }
    } else if(table === "userinfo"){
        queries.push("DELETE FROM userinfo WHERE guildId = ?");
        queriesArgs.push([guildId]);

        const userinfo = client.userinfo.toReadableArray().filter(u => u.value.filter(_u => _u.guild === guildId).length > 0);
        for(let i = 0; i < userinfo.length; i++){
            let getUserinfo = userinfo[i];
            let guildUserinfo = getUserinfo.value.filter(u => u.guild === guildId);
            if(guildUserinfo.length < 1) continue;
            let userinfoIndex = getUserinfo.value.indexOf(guildUserinfo[0]);
            if(userinfoIndex >= 0) getUserinfo.value.splice(userinfoIndex, 1);
            client.userinfo.set(getUserinfo.key, getUserinfo.value);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.userinfo.save(`userinfo`);
            } catch {}
        }
    } else if(table === "warns"){
        queries.push("DELETE FROM warns WHERE guildId = ?");
        queriesArgs.push([guildId]);

        const warns = client.warns.toReadableArray().filter(u => u.value.filter(_u => _u.guild === guildId).length > 0);
        for(let i = 0; i < warns.length; i++){
            let getWarnInfo = warns[i];
            let guildWarn = getWarnInfo.value.filter(u => u.guild === guildId);
            if(guildWarn.length < 1) continue;
            let warnIndex = getWarnInfo.value.indexOf(guildWarn[0]);
            if(warnIndex >= 0) getWarnInfo.value.splice(warnIndex, 1);
            client.warns.set(getWarnInfo.key, getWarnInfo.value);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.warns.save(`warns`);
            } catch {}
        }
    } else if(table === "suggestions"){
        queries.push("DELETE FROM suggestions WHERE guildId = ?");
        queriesArgs.push([guildId]);

        const suggestions = client.suggestions.toReadableArray().filter(u => (u.value.guild ?? guildId) === guildId);
        for(let i = 0; i < suggestions.length; i++){
            let suggestionInfo = suggestions[i];
            client.suggestions.delete(suggestionInfo.key);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.suggestions.save(`suggestions`);
            } catch {}
        }
    } else if(table === "reactrole"){
        queries.push("DELETE FROM reactrole WHERE guildId = ?");
        queriesArgs.push([guildId]);

        const reactrole = client.reactrole.toReadableArray().filter(u => u.value.filter(_u => (_u.guild ?? guildId) === guildId).length > 0);
        for(let i = 0; i < reactrole.length; i++){
            let reactroleInfo = reactrole[i];
            client.reactrole.delete(reactroleInfo.key);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.reactrole.save(`reactrole`);
            } catch {}
        }
    } else if(table === "polls"){
        queries.push("DELETE FROM polls WHERE guildId = ?");
        queriesArgs.push([guildId]);

        const polls = client.polls.toReadableArray().filter(u => (u.value.guild ?? guildId) === guildId);
        for(let i = 0; i < polls.length; i++){
            let pollInfo = polls[i];
            client.polls.delete(pollInfo.key);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.polls.save(`polls`);
            } catch {}
        }
    } else if(table === "xp"){
        queries.push("DELETE FROM xp WHERE guildId = ?");
        queriesArgs.push([guildId]);

        const xp = client.xp.toReadableArray().filter(u => u.value.filter(_u => _u.guild === guildId).length > 0);
        for(let i = 0; i < xp.length; i++){
            let getXP = xp[i];
            let guildXP = getXP.value.filter(u => u.guild === guildId);
            if(guildXP.length < 1) continue;
            let xpIndex = getXP.value.indexOf(guildXP[0]);
            if(xpIndex >= 0) getXP.value.splice(xpIndex, 1);
            client.xp.set(getXP.key, getXP.value);
        }

        if(client.config.database.type.toLowerCase() === "valuesaver"){
            try{
                await client.xp.save(`xp`);
            } catch {}
        }
    }
    if(client.config.database.type.toLowerCase() === "mysql" && queries.length > 0){
        for(let i = 0; i < queries.length; i++){
            await executeQuery(queries[i], (Array.isArray(queriesArgs[i]) ? queriesArgs[i] : undefined));
            await wait(4e2);
        }
    }
}

let updateMembers = {};

async function updateXP(){
    if(!client) return;
    if(client.config.database.type.toLowerCase() !== "mysql") return;
    let deepCopy = client.deepCopy(updateMembers);
    updateMembers = {};
    const memberKeys = Object.keys(deepCopy);
    for(let i = 0; i < memberKeys.length; i++){
        let member = memberKeys[i];
        let guilds = deepCopy[member];
        let memberXP = client.xp.get(member);
        if(!memberXP) continue;
        let addDB = memberXP.filter(u => guilds.filter(g => g.guild === u.guild).length > 0);
        for(let z = 0; z < addDB.length; z++){
            let gXP = addDB[z];
            let gStatus = guilds.filter(g => g.guild === gXP.guild)[0];
            if(!gStatus) continue;
            if(gStatus.new){
                await executeQuery('INSERT INTO xp (userId, guildId, level, messages, xp) VALUES (?, ?, ?, ?, ?)', [member, gXP.guild, gXP.level, gXP.messages, gXP.xp]);
            } else {
                await executeQuery('UPDATE xp SET level = ?, messages = ?, xp = ? WHERE userId = ? AND guildId = ?', [gXP.level, gXP.messages, gXP.xp, member, gXP.guild]);
            }
            await wait(2e2);
        }
    }
}

async function xpHandler(args, keys){
    let xp = client.xp.get(keys.memberId) ?? [];
    let guildXP = xp.filter(x => x.guild === keys.guildId);

    const updateMembersKeys = Object.keys(updateMembers);
    if(updateMembersKeys.indexOf(keys.memberId) < 0){
        updateMembers[keys.memberId] = [];
    }
    if(updateMembers[keys.memberId].filter(e => e.guild === keys.guildId).length < 1){
        updateMembers[keys.memberId].push({guild: keys.guildId, new: guildXP.length < 1});
    }

    if(guildXP.length > 0){
        let guildXPIndex = xp.indexOf(guildXP[0]);
        if(guildXPIndex >= 0) xp.splice(guildXPIndex, 1);
    }
    xp.push(args);
    client.xp.set(keys.memberId, xp);

    if(client.config.database.type.toLowerCase() === "valuesaver"){
        try{
            await client.xp.save(`xp`);
        } catch {}
    }
}

setInterval(updateXP, 5*6e4);

async function switchDB(type){
    if(type.toLowerCase() === "valuesaver" && client.config.database.type.toLowerCase() === "mysql"){
        try{
            await client.suggestions.save(`suggestions`);
            await client.globals.save(`globals`);
            await client.tickets.save(`tickets`);
            await client.warns.save(`warns`);
            await client.giveaways.save(`giveaways`);
            await client.giveawaysEnded.save(`giveawaysEnded`);
            await client.xp.save(`xp`);
            await client.economy.save(`economy`);
            await client.badwords.save(`badwords`);
            await client.userinfo.save(`userinfo`);
            await client.unverified.save(`unverified`);
            await client.reactrole.save(`reactrole`);
            await client.afk.save(`afk`);
            await client.polls.save(`polls`);
            await executeQuery('TRUNCATE suggestions');
            await wait(4e2);
            await executeQuery('TRUNCATE globals');
            await wait(4e2);
            await executeQuery('TRUNCATE tickets');
            await wait(4e2);
            await executeQuery('TRUNCATE warns');
            await wait(4e2);
            await executeQuery('TRUNCATE giveaways');
            await wait(4e2);
            await executeQuery('TRUNCATE giveawaysended');
            await wait(4e2);
            await executeQuery('TRUNCATE xp');
            await wait(4e2);
            await executeQuery('TRUNCATE economy');
            await wait(4e2);
            await executeQuery('TRUNCATE badwords');
            await wait(4e2);
            await executeQuery('TRUNCATE userinfo');
            await wait(4e2);
            await executeQuery('TRUNCATE unverified');
            await wait(4e2);
            await executeQuery('TRUNCATE reactrole');
            await wait(4e2);
            await executeQuery('TRUNCATE afk');
            await wait(4e2);
            await executeQuery('TRUNCATE polls');;

            client.config.database.type = "ValueSaver";

            configHandler(client, client.config);
            return true;
        } catch(err) {
            return false;
        }
    } else if(type.toLowerCase() === "mysql" && client.config.database.type.toLowerCase() === "valuesaver"){
        client.config.database.type = "MySQL";
        let suggestions = client.deepCopy(client.suggestions.toReadableArray());
        client.suggestions.clear();
        for(let i = 0; i < suggestions.length; i++){
            let guildId = suggestions[i].value.guild;
            if(typeof guildId !== 'string'){
                if(client.config.guilds.length === 1){
                    guildId = client.config.guilds[0];
                } else {
                    let availableGuilds = [];
                    let validGuilds = Object.keys(client.config.suggestion).filter(s => client.config.suggestion[s].channel !== false);
                    if(validGuilds.length === 1){
                        guildId = validGuilds[0];
                    }
                    for(const _i in validGuilds){
                        let m = client.mainguilds[validGuilds[_i]].members.cache.get(suggestions[i].value.userId);
                        if(!m) continue;
                        else availableGuilds.push(validGuilds[_i]);
                    }
                    if(availableGuilds.length === 1){
                        guildId = availableGuilds[0];
                    } else if(validGuilds.length > 0) {
                        guildId = validGuilds[0];
                    } else {
                        guildId = client.config.guilds[0];
                    }
                }
            }
            await client.dbHandler.setValue(`suggestions`, suggestions[i].value, {messageId: suggestions[i].key, guildId: guildId})
            await wait(4e2);
        }
        let globals = client.deepCopy(client.globals.toReadableArray());
        client.globals.clear();
        for(let i = 0; i < globals.length; i++){
            await client.dbHandler.setValue(`globals`, globals[i].value, {'globalsKey': globals[i].key});
            await wait(4e2);
        }
        let tickets = client.deepCopy(client.tickets.toReadableArray());
        client.tickets.clear();
        for(let i = 0; i < tickets.length; i++){
            let userTicket = tickets[i];
            if(!Array.isArray(userTicket.value)) continue;
            for(let z = 0; z < userTicket.value.length; z++){
                await client.dbHandler.setValue(`tickets`, userTicket.value[z], {memberId: userTicket.key, guildId: userTicket.value[z].guild, channelId: userTicket.value[z].channel});
                await wait(4e2);
            }
        }
        let warns = client.deepCopy(client.warns.toReadableArray());
        client.warns.clear();
        for(let i = 0; i < warns.length; i++){
            let userWarns = warns[i];
            for(let z = 0; z < userWarns.value.length; z++){
                let guildId = userWarns.value[z].guild;
                if(typeof guildId !== 'string'){
                    let availableGuilds = [];
                    for(const _i in client.config.guilds){
                        let m = client.mainguilds[client.config.guilds[_i]].members.cache.get(userWarns.key);
                        if(!m) continue;
                        else availableGuilds.push(client.config.guilds[_i]);
                    }
                    if(availableGuilds.length === 1){
                        guildId = availableGuilds[0];
                    } else {
                        guildId = client.config.guilds[0];
                    }
                }
                await client.dbHandler.setValue(`warns`, userWarns.value[z], {memberId: userWarns.key, guildId: guildId});
                await wait(4e2);
            }
        }
        let giveaways = client.deepCopy(client.giveaways.toReadableArray());
        client.giveaways.clear();
        for(let i = 0; i < giveaways.length; i++){
            await client.dbHandler.setValue(`giveaways`, giveaways[i].value, {messageId: giveaways[i].key});
            await wait(4e2);
        }
        let giveawaysEnded = client.deepCopy(client.giveawaysEnded.toReadableArray());
        client.giveawaysEnded.clear();
        for(let i = 0; i < giveawaysEnded.length; i++){
            await client.dbHandler.setValue(`giveawaysEnded`, giveawaysEnded[i].value, {messageId: giveawaysEnded[i].key});
            await wait(4e2);
        }
        let xp = client.deepCopy(client.xp.toReadableArray());
        client.xp.clear();
        for(let i = 0; i < xp.length; i++){
            let userXP = xp[i];
            for(let z = 0; z < userXP.value.length; z++){
                let guildXP = userXP.value[z];
                await client.dbHandler.xpHandler(guildXP, {memberId: userXP.key, guildId: guildXP.guild});
                await wait(4e2);
            }
        }
        let economy = client.deepCopy(client.economy.toReadableArray());
        client.economy.clear();
        for(let i = 0; i < economy.length; i++){
            let userEconomy = economy[i];
            for(let z = 0; z < userEconomy.value.length; z++){
                await client.dbHandler.setValue(`economy`, userEconomy.value[z], {memberId: userEconomy.key, guildId: userEconomy.value[z].guild});
                await wait(4e2);
            }
        }
        let badwords = client.deepCopy(client.badwords.toReadableArray());
        client.badwords.clear();
        for(let i = 0; i < badwords.length; i++){
            let guildBadwords = badwords[i];
            for(let z = 0; z < guildBadwords.value.length; z++){
                await client.dbHandler.setValue(`badwords`, guildBadwords.value[z].toLowerCase(), {guildId: guildBadwords.key});
                await wait(4e2);
            }
        }
        let userinfo = client.deepCopy(client.userinfo.toReadableArray());
        client.userinfo.clear();
        for(let i = 0; i < userinfo.length; i++){
            let sUserinfo = userinfo[i];
            for(let z = 0; z < sUserinfo.value.length; z++){
                await client.dbHandler.setValue(`userinfo`, sUserinfo.value[z], {memberId: sUserinfo.key, guildId: sUserinfo.value[z].guild});
                await wait(4e2);
            }
        }
        let unverified = client.deepCopy(client.unverified.toReadableArray());
        client.unverified.clear();
        for(let i = 0; i < unverified.length; i++){
            let userUnverified = unverified[i];
            for(let z = 0; z < userUnverified.value.length; z++){
                await client.dbHandler.setValue(`unverified`, userUnverified.value[z], {memberId: userUnverified.key, guildId: userUnverified.value[z].guild});
                await wait(4e2);
            }
        }
        let reactrole = client.deepCopy(client.reactrole.toReadableArray());
        client.reactrole.clear();
        for(let i = 0; i < reactrole.length; i++){
            let reactroleMsg = reactrole[i];
            for(let z = 0; z < reactroleMsg.value.length; z++){
                let reactroleInteraction = reactroleMsg.value[z];
                let guildId =  reactroleInteraction.guild;
                if(typeof guildId !== 'string'){
                    let channel = client.channels.cache.get(reactroleInteraction.channel);
                    if(!channel){
                        guildId = client.config.guilds[0];
                    } else {
                        guildId = channel.guild.id;
                    }
                }
                await client.dbHandler.setValue(`reactrole`, reactroleInteraction, {messageId: reactroleMsg.key, roleId: reactroleInteraction.role, channelId: reactroleInteraction.channel, guildId: guildId});
                await wait(4e2);
            }
        }
        let afk = client.deepCopy(client.afk.toReadableArray());
        client.afk.clear();
        for(let i = 0; i < afk.length; i++){
            let userAFK = afk[i];
            for(let z = 0; z < userAFK.value.length; z++){
                await client.dbHandler.setValue(`afk`, userAFK.value[z], {memberId: userAFK.key});
                await wait(4e2);
            }
        }
        let polls = client.deepCopy(client.polls.toReadableArray());
        client.polls.clear();
        for(let i = 0; i < polls.length; i++){
            let pollMsg = polls[i];
            let guildId = pollMsg.value.guild;
            if(typeof guildId !== 'string'){
                let channel = client.channels.cache.get(pollMsg.value.channel);
                if(!channel){
                    guildId = client.config.guilds[0];
                } else {
                    guildId = channel.guild.id;
                }
            }
            await client.dbHandler.setValue(`polls`, pollMsg.value, {messageId: pollMsg.key, channelId: pollMsg.value.channel, guildId: guildId});
            await wait(4e2);
        }

        await client.globals.removeAllSaves();

        await updateXP();

        configHandler(client, client.config);

        return true;
    }
}

module.exports = { start, setValue, deleteValue, forceDeleteGuild, xpHandler, switchDB, reconnect };
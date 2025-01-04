const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const config = require('./config.json');
const configTemplate = require('./files/configTemplate.json');
const configHandler = require('./handlers/saveConfig.js');
var removeFiles = require('./files/removeFiles.json');

function compare(object, comparison, usedKeys, r) {
	var missing = [];
	var cuObj = object;
	var cuObjc = comparison;
	for(var i = 0; i < usedKeys.length; i++){
		cuObj = cuObj[usedKeys[i]];
		cuObjc = cuObjc[usedKeys[i]];
	}
	for(var key in cuObj){
		if(!cuObjc[key]){
			var missingKeys = [...usedKeys, key];
			missing.push(missingKeys);
		} else if(typeof cuObj[key] === 'object' && !Array.isArray(cuObj[key])) {
			usedKeys.push(key);
			missing.push(...compare(object, comparison, usedKeys, true));
			usedKeys.splice((usedKeys.length - 1), 1);
		}
		if(r === false){
			usedKeys = [];
		}
	}
	return missing;
}

const rename = promisify(fs.rename);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const rmdir = promisify(fs.rm);
const unlink = promisify(fs.unlink);

module.exports = function(installed){
    return new Promise(async (resolve) => {
        if(installed === true){
            for(var i = 0; i < removeFiles.length; i++){
                var file = removeFiles[i];
                if(fs.existsSync(path.join(__dirname, file))){
                    var stat = fs.statSync(path.join(__dirname, file));
                    if(stat.isDirectory()){
                        fs.rmSync(path.join(__dirname, file), { recursive: true, force: true });
                    } else if(stat.isFile()){
                        fs.unlinkSync(path.join(__dirname, file));
                    }
                }
            }
            if(removeFiles.length > 0){
                removeFiles = [];
                fs.writeFileSync(path.join(__dirname, `/files/removeFiles.json`), JSON.stringify(removeFiles));
            }
            if(!fs.existsSync(path.join(__dirname, `./messages.json`))){
                await copyFile(path.join(__dirname, `./files/messagesTemplate.json`), path.join(__dirname, `./messages.json`));
            } else {
                var messages = require('./messages.json');
                var newMessages = require('./files/messagesTemplate.json');
                
                var diff = compare(newMessages, messages, [], false);
                var cuObj = newMessages;
                var cuObjc = messages;
                for(var i = 0; i < diff.length; i++){
                    var change = diff[i];
                    for(var z = 0; z < change.length; z++){
                        cuObj = cuObj[change[z]];
                        if(z < (change.length - 1)){
                            cuObjc = cuObjc[change[z]];
                        } else {
                            cuObjc[change[z]] = cuObj;
                        }
                    }
                    cuObj = newMessages;
                    cuObjc = messages;
                }

                await writeFile(path.join(__dirname, `./messages.json`), JSON.stringify(messages, null, 2));
            }
        } else {
            if(fs.existsSync(path.join(__dirname, `./files-backup`))){
                try{
                    var filesBackupStatus = await stat(path.join(__dirname, `./files-backup`));
                    if(filesBackupStatus.isDirectory()){
                        await rmdir(path.join(__dirname, `./files-backup`), {force: true, recursive: true});
                    } else {
                        await unlink(path.join((__dirname, `./files-backup`)));
                    }
                    await rename(path.join(__dirname, './files'), path.join(__dirname, './files-backup'));
                } catch {}
            } else {
                await rename(path.join(__dirname, './files'), path.join(__dirname, './files-backup'));
            }
            if(Object.keys(config.tickets).indexOf('claim-system') < 0){
                config.tickets['claim-system'] = {};
                for(var i = 0; i < config.guilds.length; i++){
                    config.tickets['claim-system'][config.guilds[i]] = true;
                }
            }
            if(Object.keys(config.tickets).indexOf('instant-category') < 0){
                config.tickets['instant-category'] = {};
                for(var i = 0; i < config.guilds.length; i++){
                    config.tickets['instant-category'][config.guilds[i]] = false;
                }
            }
            if(Object.keys(config.tickets).indexOf('tag-support') < 0){
                config.tickets['tag-support'] = {};
                for(var i = 0; i < config.guilds.length; i++){
                    config.tickets['tag-support'][config.guilds[i]] = true;
                }
            }
            if(Object.keys(config.level).indexOf('difficulty') < 0){
                config.level.difficulty = {};
                for(var i = 0; i < config.guilds.length; i++){
                    config.level.difficulty[config.guilds[i]] = "EXPONENTIAL HARD";
                }
            }
            if(Object.keys(config).indexOf('polls') < 0){
                config['polls'] = true;
            }
            if(config.categories.filter(c => c.category === "polls").length === 0){
                config.categories.push({
                    category: 'polls',
                    emoji: '📊'
                });
            }
            if(Object.keys(config).indexOf('message-commands') < 0){
                config['message-commands'] = true;
            }
            if(Object.keys(config.tickets).indexOf('logs-channel') < 0){
                config.tickets['logs-channel'] = {};
                for(let i = 0; i < config.guilds.length; i++){
                    config.tickets['logs-channel'][config.guilds[i]] = config.logs[config.guilds[i]] ?? false;
                }
            }
            if(Object.keys(config).indexOf('suggestion') < 0){
                config.suggestion = {};
                for(let i = 0; i < config.guilds.length; i++){
                    config.suggestion[config.guilds[i]] = {
                        channel: config.suggestionChannel[config.guilds[i]],
                        conversion: true,
                        autoThread: true
                    };
                }
                delete config.suggestionChannel;
            }
            if(Object.keys(config).indexOf('debugger') < 0){
                config.debugger = false;
            }
            if(Object.keys(config).indexOf('database') < 0){
                config.database = {
                    type: 'ValueSaver',
                    mysql: {
                        host: null,
                        user: null,
                        password: null,
                        database: null
                    }
                };
            }
            if(Object.keys(config).indexOf('logMessages') >= 0){
                delete config.logMessages;
            }
            for(let i = 0; i < config.guilds.length; i++){
                if(typeof config.logs['channel'] !== 'object' || typeof config.logs['member'] !== 'object' || typeof config.logs['role'] !== 'object' || typeof config.logs['message'] !== 'object'){
                    if(typeof config.logs['channel'] !== 'object') config.logs['channel'] = {};
                    if(typeof config.logs['member'] !== 'object') config.logs['member'] = {};
                    if(typeof config.logs['role'] !== 'object') config.logs['role'] = {};
                    if(typeof config.logs['message'] !== 'object') config.logs['message'] = {};
                    if(['boolean', 'string'].indexOf(typeof config.logs[config.guilds[i]]) >= 0){
                        config.logs['channel'][config.guilds[i]] = config.logs[config.guilds[i]];
                        config.logs['member'][config.guilds[i]] = config.logs[config.guilds[i]];
                        config.logs['role'][config.guilds[i]] = config.logs[config.guilds[i]];
                        config.logs['message'][config.guilds[i]] = config.logs[config.guilds[i]];
                        delete config.logs[config.guilds[i]];
                    }
                }
            }
            if(Object.keys(config.suggestion).indexOf('autoThread') < 0){
                for(const guild of config.guilds){
                    config.suggestion[guild]['autoThread'] = true;
                }
            }
            if(Object.keys(config).indexOf('ffmpeg') < 0){
                config.ffmpeg = true;
            }
            if(Object.keys(config.level).indexOf('canvas-type') < 0){
                config.level['canvas-type'] = {};
                for(const guild of config.guilds){
                    config.level['canvas-type'][guild] = "MODERN";
                }
            }
            if(Object.keys(config.tickets).indexOf('auto-tag') < 0){
                config.tickets['auto-tag'] = {};
                for(const guild of config.guilds){
                    config.tickets['auto-tag'][guild] = false;
                }
            }
            if(Object.keys(config).indexOf('youtubeApiKey') < 0){
                config['youtubeApiKey'] = null;
            }
            for(var key in configTemplate){
                configTemplate[key] = config[key];
            }
            configHandler({}, configTemplate);
        }
        resolve();
    });
}
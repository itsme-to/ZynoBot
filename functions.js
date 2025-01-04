const fs = require('fs');
const fsPromises = fs.promises;
const xpCache = new Map();
var axios = null;
let client;
if (fs.existsSync(`./node_modules/axios/`)) {
    axios = require('axios').default;
}
var Canvas = null;
if (fs.existsSync(`./node_modules/@napi-rs/canvas/`)) {
    Canvas = require('@napi-rs/canvas');
}
const path = require('path');
const { URL } = require('url');

function passClient(_client) {
    client = _client;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function readFolder(arr) {
    let files = [];
    for (const file of arr) {
        const stats = await fsPromises.stat(file);
        if (stats.isFile()) {
            files.push(file);
        } else if (stats.isDirectory()) {
            const folder = (await fsPromises.readdir(file)).map(_file => path.join(file, _file));
            const nestedFiles = await readFolder(folder);
            files.push(...nestedFiles);
        }
    }
    return files;
}

function validateURL(url) {
    try {
        const u = new URL(url);
        if (u.hostname.length === 0 && u.host.length === 0) return false;
        return u;
    } catch {
        return false;
    }
}

function validateImage(url) {
    return new Promise((resolve, reject) => {
        axios.get(url).then(res => {
            if (res.status >= 400) {
                return reject();
            }
            resolve();
        }).catch(err => {
            reject(err);
        });
    });
}

const getChannelType = (type) => {
    const channelTypes = {
        0: 'Text channel',
        1: 'DM',
        2: 'Voice channel',
        3: 'Group DM',
        4: 'Category',
        5: 'News channel',
        10: 'News thread',
        11: 'Public thread',
        12: 'Private thread',
        13: 'Stage channel',
        14: 'Directory',
        15: 'Forum'
    };
    return channelTypes[type] || 'Unknown channel type';
};

function applyText(canvas, text, maxFontSize = 90, fontType = 'Default Font', offset = 200) {
    const context = canvas.getContext('2d');
    let minFontSize = 10;
    let fontSize = maxFontSize;

    while (minFontSize < fontSize) {
        const midFontSize = Math.floor((minFontSize + fontSize) / 2);
        context.font = `${midFontSize}px ${fontType}`;
        if (context.measureText(text).width > (canvas.width - offset)) {
            fontSize = midFontSize - 1;
        } else {
            minFontSize = midFontSize + 1;
        }
    }

    context.font = `${fontSize}px ${fontType}`;
    return context.font;
}

function generateVerify(embedColor, iconURL) {
    return new Promise(async (resolve, reject) => {
        const canvas = Canvas.createCanvas(800, 300);
        const context = canvas.getContext('2d');
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var code = '';
        const codeLength = Math.round(Math.random() * 3) + 5;
        while (code.length < codeLength) {
            code += characters[Math.round((characters.length - 1) * Math.random())];
        }

        context.fillStyle = "#2e2e2e";
        context.fillRect(0, 0, canvas.width, canvas.height);

        const mainColor = "#37db68";
        const secondaryColor = '#ffffff';

        var fakeCode = '';
        const fakeCodeLength = Math.round(10 * Math.random()) + 20;
        while (fakeCode.length < fakeCodeLength) {
            fakeCode += characters[Math.round((characters.length - 1) * Math.random())];
        }

        context.fillStyle = secondaryColor;
        context.font = "20px Default Font";

        const space = Math.round(canvas.width / fakeCodeLength);
        var xPosition = space;
        for (var i = 0; i < fakeCode.length; i++) {
            var minXPosition = xPosition - space;
            var newXPosition = Math.round(Math.random() * space) + minXPosition;
            var newYPosition = Math.round(Math.random() * 120) + 150;
            context.fillText(fakeCode[i], newXPosition, newYPosition);
            xPosition = xPosition + space;
        }

        context.fillStyle = mainColor;
        context.font = "30px Default Font";

        const mainSpace = Math.round(canvas.width / code.length);
        var mainXPosition = mainSpace;
        for (var i = 0; i < code.length; i++) {
            var minXPosition = mainXPosition - mainSpace;
            var newXPosition = Math.round(Math.random() * space) + minXPosition;
            var newYPosition = Math.round(Math.random() * 120) + 150;
            context.fillText(code[i], newXPosition, newYPosition);
            mainXPosition = mainXPosition + mainSpace;
        }

        context.strokeStyle = embedColor;
        context.lineWidth = 70;
        context.beginPath();
        context.moveTo(0, 35);
        context.lineTo(canvas.width, 35);
        context.stroke();
        context.closePath();

        context.beginPath();
        context.arc(400, 70, 50, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();

        try {
            const arrBuff = await axios.get(iconURL, { responseType: 'arraybuffer' });
            const guildImage = new Canvas.Image();
            guildImage.src = Buffer.from(arrBuff.data);
            context.drawImage(guildImage, 350, 20, 100, 100);
        } catch (err) { }

        const canvasBuffer = canvas.toBuffer('image/png');

        resolve({ buffer: canvasBuffer, code: code });
    });
}

function validateEmote(emote) {
    let emoteRegEx = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    return emoteRegEx.test(emote);
}

const validateDiscordEmote = (emote) => {
    emote = emote.toLowerCase();
    const emoteRegex = /^<[a-z]{0,2}:[^:\n]+:[0-9]+>$/;
    if (!emoteRegex.test(emote)) return false;

    const [, emoteName, emoteId] = emote.match(/^<[a-z]{0,2}:([^:\n]+):([0-9]+)>$/);

    if (emoteName.length > 32 || isNaN(emoteId)) return false;

    return true;
};

function getXPForLevel(level, gId) {
    const key = `${gId}_${level}`;
    if (xpCache.has(key)) {
        return xpCache.get(key);
    }

    let xp;
    const difficulty = client.config.level.difficulty[gId];
    if (difficulty === "EXPONENTIAL HARD") {
        xp = Math.round(2 ** ((level) / 4 * 5 + 1));
    } else if (difficulty === "EXPONENTIAL NORMAL") {
        xp = Math.round(1.7 ** ((level) / 4 * 5 + 1));
    } else if (difficulty === "LINEAR" || difficulty === "LINEAR NORMAL") {
        xp = Math.round(level * 100);
    } else if (difficulty === "LINEAR HARD") {
        xp = Math.round(level * 100) * 2.5;
    } else {
        xp = Infinity;
    }

    xpCache.set(key, xp);
    return xp;
}

function saveTemporary(filename, buffer) {
    if (!fs.existsSync(path.join(__dirname, `/files/temporary/`))) {
        fs.mkdirSync(path.join(__dirname, `/files/temporary/`));
    }
    fs.writeFileSync(path.join(__dirname, `/files/temporary/${filename}`), buffer);

    return path.join(__dirname, `/files/temporary/${filename}`);
}

function usernameCreator(user) {
    return user.username.replace(/[^a-zA-Z0-9]+/g, '');
}

function getResolvableDate(dateResolvable) {
    var currentTimestamp = new Date().getTime();
    if (typeof dateResolvable === 'number') {
        if (dateResolvable > currentTimestamp) return dateResolvable - currentTimestamp;
        else return dateResolvable;
    } else if (typeof dateResolvable === 'string') {
        if (!/^[0-9a-zA-Z ]*$/.test(dateResolvable)) return 6e4;
        var date = /^[0-9]*/.exec(dateResolvable);
        var dateNumber = parseInt(date[0]);
        var dateType = dateResolvable.split(date[0]).slice(1).join(date[0]).split(' ').join('').toLowerCase();
        if (dateType === 'week' || dateType === 'weeks' || dateType === 'w') {
            return dateNumber * 7 * 24 * 60 * 60 * 1000;
        } else if (dateType === 'day' || dateType === 'days' || dateType === 'd') {
            return dateNumber * 24 * 60 * 60 * 1000;
        } else if (dateType === 'hour' || dateType === 'hours' || dateType === 'h') {
            return dateNumber * 60 * 60 * 1000;
        } else if (dateType === 'minute' || dateType === 'minutes' || dateType === 'm') {
            return dateNumber * 60 * 1000;
        } else if (dateType === 'second' || dateType === 'seconds' || dateType === 's') {
            return dateNumber * 1000;
        } else if (dateType === 'milisecond' || dateType === 'miliseconds' || dateType === 'ms') {
            return dateNumber;
        } else {
            return 6e4;
        }
    } else {
        return 6e4;
    }
}

const bitfieldInfo = {
    bitfield: {
        COMMANDS: 1,
        MEMBERS: 2,
        MESSAGES: 4,
        KICKS: 8,
        BANS: 16,
        GUILDS: 32,
        CHANNELS: 64,
        SAVES: 128,
        ADDONS: 256,
        EMOJIS: 512,
        ROLES: 1024,
        SERVERS: 2048,
        BOT: 4096,
        INTERACTIONS: 8192,
        MODULES: 16384
    },
    strings: {
        COMMANDS: "Create commands, detect when a command get's executed and make possible changes to them",
        MEMBERS: "Detect changes to members and make changes to them",
        MESSAGES: "Read messages that are sent and make changes to them",
        KICKS: "Detect when a member gets kicked",
        BANS: "Detect when a member gets banned",
        GUILDS: "Read and make changes to guilds",
        CHANNELS: "Read and make changes to the channels the bot has access to",
        SAVES: "Read all the data that has been saved and save or delete data",
        ADDONS: "Read all other registered addons and make changes to them",
        EMOJIS: "Create, edit and delete emoji's for guilds",
        ROLES: "Create, edit and delete roles in a guild",
        SERVERS: "Start a HTTP or WebSocket server and handle requests of the server",
        BOT: "Make changes to the bot",
        INTERACTIONS: "Detect interactions like buttons or menu's, get information about them and reply to them",
        MODULES: "Enable or disable any modules of the bot"
    }
};

function getPermissionsString(bitfield) {
    var permissionString = [];
    if (typeof bitfield !== 'number') throw new Error(`Invalid bitfied: Bitfield is not a number`);
    var bitfieldKeys = Object.keys(bitfieldInfo.bitfield);
    var bitfieldValues = Object.values(bitfieldInfo.bitfield);
    for (var i = 0; i < bitfieldValues.length; i++) {
        var bitValue = bitfieldValues[i];
        if (bitfield & bitValue) {
            permissionString.push(bitfieldInfo.strings[bitfieldKeys[i]])
        }
    }
    return permissionString;
}

function genRandString(length = 15) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let strArr = [];
    while (strArr.length < length) {
        const randChar = chars[Math.floor(Math.random() * chars.length)];
        strArr.push(/^[a-z]*$/.test(randChar) && Math.random() > 0.5 ? randChar.toUpperCase() : randChar);
    }
    return strArr.join('');
}

module.exports = { wait, readFolder: readFolder, validateURL, getChannelType, applyText, generateVerify, validateEmote, validateDiscordEmote, validateImage, getXPForLevel, saveTemporary, usernameCreator, getResolvableDate, passClient, getPermissionsString, genRandString };
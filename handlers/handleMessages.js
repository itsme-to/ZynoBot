module.exports = (client, user, user2, channel, _text, additionalText) => {
    var text = _text;
    if(typeof user2 !== 'undefined' && _text.indexOf('2]') >= 0){
        text = text.split('[USER 2]').join(`<@!${user2.id}>`).split('[USERNAME 2]').join(user2.displayName).split('[TAG 2]').join(user2.displayName).split('[ID 2]').join(user2.id);
    }
    if(typeof additionalText === 'string'){
        if(text.indexOf('[ADDITIONAL TEXT]') >= 0){
            text = text.split('[ADDITIONAL TEXT]').join(additionalText);
        }
    } else if(typeof additionalText === 'object'){
        if(Array.isArray(additionalText)){
            for(var i = 0; i < additionalText.length; i++){
                var item = additionalText[i];
                for(const key in item){
                    var placeholder = `[^${key}]`;
                    var i = text.indexOf(placeholder);
                    if(i >= 0){
                        text = text.split(placeholder).join(item[key]);
                    }
                    delete item[key];
                }
            }
        }
    }
    return text.split('[USERNAME]').join(user.displayName).split('[USER]').join(`<@!${user.id}>`).split('[TAG]').join(user.displayName).split('[ID]').join(user.id).split('[CHANNEL]').join(`<#${channel.id}>`).split('[CHANNEL NAME]').join(channel.name).split('[CHANNEL ID]').join(channel.id).split('[CLIENT USERNAME]').join(client.user.username).split('[CLIENT USER]').join(`<@!${client.user.id}>`).split('[CLIENT TAG]').join(client.user.username);
}
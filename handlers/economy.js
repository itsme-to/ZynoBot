function getUser(client, userId, message){
    let economyUser = client.deepCopy(client.economy.get(userId) || [{
        bank: 0,
        cash: 0,
        timeouts: {
            work: 0,
            beg: 0,
            crime: 0,
            rob: 0,
            daily: 0
        },
        inventory: [],
        guild: message.guild.id
    }]);

    if(!Array.isArray(economyUser)){
        economyUser = [economyUser];
    }

    if(economyUser.filter(e => e.guild === message.guild.id).length === 0){
        economyUser.push({
            bank: 0,
            cash: 0,
            timeouts: {
                work: 0,
                beg: 0,
                crime: 0,
                rob: 0,
                daily: 0
            },
            inventory: [],
            guild: message.guild.id
        });
    }

	let missingEconomyInventory = economyUser.filter(e => !Array.isArray(e.inventory));
    for(let i = 0; i < missingEconomyInventory.length; i++){
		let index = economyUser.indexOf(missingEconomyInventory[i]);
        if(index >= 0){
            missingEconomyInventory[i].inventory = [];
            economyUser[index] = missingEconomyInventory[i];
        }
    }

    return economyUser;
}

function getNumber(min, max){
    return Math.round((Math.random() * (max - min))) + min;
}

module.exports = {getUser, getNumber};
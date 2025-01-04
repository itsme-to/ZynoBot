const fs = require('fs');
const path = require('path');

module.exports = function(client, _config){
    var config = JSON.stringify(_config, null, 4);

    fs.writeFileSync(path.join(__dirname, `../config.json`), config);

    client['config'] = _config;
};
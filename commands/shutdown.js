const prefix = require('../config/config.json').prefix;

const event = 'messageCreate';       //どの機能を使うか

const handler = async message => {
    if(message.content === `${prefix}shutdown`){
        await message.channel.send(`さようなら皆さん`);
        await console.log('shutdown');
        await process.exit();
    }
};

module.exports = {event, handler};

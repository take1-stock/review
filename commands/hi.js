//hi.js
//test用
const emoji = require('node-emoji');
const prefix = require('../config/config.json').prefix;

const event = 'messageCreate';

const handler = async message => {
    if (message.content === `${prefix}hi`) {
        message.channel.send('hello');
        message.react(emoji.get('grey_exclamation'));
    }
};

module.exports = { event, handler };

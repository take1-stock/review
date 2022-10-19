const Discord = require('discord.js');
require('dotenv').config(); //.envでtokenとか管理
const config = require('./configJsons/config.json');

const events = require('./commands');

const client = new Discord.Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS']
});

//必須
const prefix = config.prefix;   //コマンドの頭文字

// 読み込み部分
// point: DRY(Don't Repeat Yourself)なコードにするには、２度同じ表明を書かなくて済むように考えると良い
events.forEach(({event, handler}) => client.on(event, handler));            //commands_eventsファイルからコマンドを読み込む

client.on('ready', () => {
    //client.channels.cache.get(config.logchannel).send('起動したよ');
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);

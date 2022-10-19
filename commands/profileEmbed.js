const Discord = require('discord.js');
const prefix = require('../config/config.json').prefix;
const fs = require('fs');
const { setTimeout } = require('timers/promises');
const URL = require("url").URL;

const event = 'messageCreate';

const handler = async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(`${prefix}pf`)) return;

    let [option, text] = splitOptionText(message.content);

    const avatarUrl = message.author.avatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png';

    let embedProps = {
        title: '',
        color: 'Default',
        description: '',
        image: {
            url: '',
        },
    };

    // ファイルが存在する場合、プロフィールの内容は更新処理になる
    const hasProfile = fs.existsSync(`./profilesData/${message.author.id}.json`);

    // プロフィールがすでにある場合はファイルロードする
    if( hasProfile ){
        const embeds = fs.readFileSync(`./profilesData/${message.author.id}.json`);
        embedProps = await JSON.parse(embeds, 'utf8')['embeds'][0];
    }

    const embedTemplate = await new Discord.MessageEmbed()
            .setAuthor({
                name: `${message.member.displayName}`,  // displayNameだとnicknameも考慮してくれる
                iconURL: avatarUrl,
            })
            .setTitle(embedProps.title)
            .setColor(embedProps.color)
            .setDescription(embedProps.description)
            .setImage(embedProps.image.url)
            .setThumbnail(avatarUrl)
            .setTimestamp()

    if(/^display$/i.test(option) && jsonData != null){
        message.channel.send(jsonData);
        return;
    }

    switch(true){
        case /^help$/i.test(option):
            message.channel.send(
                "コマンド例 !pf title hogehoge" + "\n" +
                "オプション:" + "\n" +
                "color : 色コードを入力してください" + "\n" +
                "title : 文字を入力してください" + "\n" +
                "description : 文字を入力してください" + "\n" +
                "image : URLを入力してください" + "\n" +
                "display : プロフィールが表示されます"
            );
            break;
        case /^color$/i.test(option):       //colorチェックしないとだめ
            if(text.match(/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)){   //#は使わない
                embedTemplate.setColor(text) // #0099f 0x0099ff
            }else{
                message.channel.send('値が間違っています\n 例: 0099ff または AAA');
            }
            break;
        case /^title$/i.test(option):
            embedTemplate.setTitle(text)
            break;
        case /^description$/i.test(option):
            embedTemplate.setDescription(text)
            break;
        case /^image$/i.test(option):
            if(imageCheck(text)){
                embedTemplate.setImage(text)
            }else{
                message.channel.send('正しいurlを入力してください');
            }
            break;
        case /^display$/i.test(option):
            break
        default:
            message.channel.send(`${option}オプションは存在しません。\nオプション例: color, title, description, image`);
            break;
    }

    // 保存するオブジェクト
    let profileObject = {
        embeds: [embedTemplate],
    }

    fs.writeFile(`./profilesData/${message.author.id}.json`, JSON.stringify(profileObject, null, '    '), (err, file) => {
        if(err){
            console.log(err);
        }else{
            console.log('Profile file write OK')

            // プロフィールを持たない = 新規作成なのでそのようなログを配信する
            if( !hasProfile ) {
                message.channel.send("プロフィールを作成しました。");
            }
        }
    });


    //表示して削除
    const reply = await message.channel.send({ embeds: [embedTemplate] });
    await setTimeout(5000);
    await message.delete();
    await reply.delete();

    function imageCheck(url){
        try{
            new URL(url);
            return true;
        }catch (err){
            return false;
        }
    }

    function splitOptionText(messageContent){
        let arrayText = messageContent.split(' ').slice(1);
        let text = arrayText.slice(1).join(' ');    //説明文
        return [arrayText[0], text];
    }
}

module.exports = {event, handler};

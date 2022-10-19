const Discord = require('discord.js');
const prefix = require('../config/config.json').prefix;
const fs = require('fs');
const { setTimeout } = require('timers/promises');
const URL = require("url").URL;

const event = 'messageCreate';

// 該当のテキストがURL形式であるかを調べる
function isUrl(url){
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

// 与えれたメッセージテキストを
// {prefix}pf/オプション/引数
// の3つに分割しオプションと引数を返す
function splitOptionText(message){
    // (prefix)pf の部分は除外して読み出す
    const [_pf, opt, ...descs] = message.split(' ');
    return [opt, descs.join(' ')];
}

const handler = async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(`${prefix}pf`)) return;

    let [option, text] = splitOptionText(message.content);

    const avatarUrl = message.author.avatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png';

    let willDelteMessage = true;
    let replyMessage = '';
    let profile = {
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
        profile = await JSON.parse(embeds, 'utf8')['embeds'][0];
    }

    switch(true){
        case /^display$/i.test(option):
            willDeleteMessage = false;
            break;

        case /^help$/i.test(option):
            replyMessage =
                "コマンド例 !pf title hogehoge" + "\n" +
                "オプション:" + "\n" +
                "color : 色コードを入力してください" + "\n" +
                "title : 文字を入力してください" + "\n" +
                "description : 文字を入力してください" + "\n" +
                "image : URLを入力してください" + "\n" +
                "display : プロフィールが表示されます";
            break;

        case /^color$/i.test(option):       //colorチェックしないとだめ
            if(text.match(/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)){   //#は使わない
                profile.color = text;
            }else{
                replyMessage = '値が間違っています\n 例: 0099ff または AAA';
            }
            break;
        case /^title$/i.test(option):
            profile.title = text;
            break;
        case /^description$/i.test(option):
            profile.description = text;
            break;
        case /^image$/i.test(option):
            if(isUrl(text)){
                profile.image.url = text;
            }else{
                replyMessage = '正しいurlを入力してください';
            }
            break;
        default:
            replyMessage = `${option}オプションは存在しません。\nオプション例: color, title, description, image`;
            break;
    }

    // 保存するオブジェクト
    // 互換性を崩さないためにprofileObjectは
    // (root) -> "embeds" -> Array -> 0番目オブジェクト -> profile
    // という構造を保っていますが、タイミングを見て profile を直接保存するとより良いと思います...!
    let profileForSave = {
        embeds: [profile],
    };

    fs.writeFile(`./profilesData/${message.author.id}.json`, JSON.stringify(profileForSave, null, '    '), (err, file) => {
        if(err){
            console.log(err);
        } else {
            console.log('Profile file write OK')

            // プロフィールを持たない = 新規作成なのでそのようなログを配信する
            if( !hasProfile ) {
                message.channel.send("プロフィールを作成しました。");
            }
        }
    });

    const embed = await new Discord.MessageEmbed()
            .setAuthor({
                // displayNameだとnicknameも考慮してくれる
                name: `${message.member.displayName}`,
                iconURL: avatarUrl,
            })
            .setTitle(profile.title)
            .setColor(profile.color)
            .setDescription(profile.description)
            .setImage(profile.image.url)
            .setThumbnail(avatarUrl)
            .setTimestamp();

    // もし付加的なメッセージがあれば送信
    if(replyMessage !== '') {
        message.channel.send(replyMessage);
    }

    // 表示して削除
    const reply = await message.channel.send({ embeds: [embed] });
    if( willDeleteMessage ) {
        await setTimeout(5000);
        await message.delete();
        await reply.delete();
    }
}

module.exports = {event, handler};

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
// {prefix}pf/サブコマンド/引数
// の3つに分割しオプションと引数を返す
function splitSubcommandText(message){
    // (prefix)pf の部分は除外して読み出す
    const [_pf, cmd, ...descs] = message.split(' ');
    return [cmd, descs.join(' ')];
}

class ProfileEmbedCommand {
    constructor(message) {
        this.message = message;

        this.hasProfile = false;
        this.replyMessage = '';
        this.willDeleteMessage = true;

        this.profile = {
            title: '',
            color: 'Default',
            description: '',
            image: {
                url: '',
            },
        };
    }

    profilePath() {
        return `./profilesData/${this.message.author.id}.json`;
    }

    async loadProfile() {
        // ファイルが存在する場合、プロフィールの内容は更新処理になる
        this.hasProfile = fs.existsSync(this.profilePath());

        if( this.hasProfile ){
            // プロフィールがすでにある場合はファイルロードする
            const embeds = fs.readFileSync(this.profilePath());
            this.profile = await JSON.parse(embeds, 'utf8')['embeds'][0];
        }
    }

    // 保存するオブジェクト
    // 互換性を崩さないためにprofileObjectは
    // (root) -> "embeds" -> Array -> 0番目オブジェクト -> profile
    // という構造を保っていますが、タイミングを見て profile を直接保存するとより良いと思います...!
    profileForSave() {
        const profileForSave = {
            embeds: [this.profile],
        };
        const jsonStr = JSON.stringify(profileForSave, null, '    ');
        return jsonStr;
    }

    async writeProfile() {
        fs.writeFile(this.profilePath(), this.profileForSave(), (err, _file) => {
            if(err){
                console.log(err);
            } else {
                console.log('Profile file write OK')

                // プロフィールを持たない = 新規作成なのでそのようなログを配信する
                if( !this.hasProfile ) {
                    this.message.channel.send("プロフィールを作成しました。");
                }
            }
        });
    }

    run(name, text) {
        const cmds = {
            display: this.display,
            help: this.help,
            color: this.color,
            title: this.title,
            image: this.image,
        };

        const cmd = cmds[name];
        if(cmd == null) {
            this.notfound(name);
            return;
        }
        cmd.call(this, text);
    }

    display() {
        this.willDeleteMessage = false;
    }

    help() {
        this.replyMessage =
            "コマンド例 !pf title hogehoge" + "\n" +
            "オプション:" + "\n" +
            "color : 色コードを入力してください" + "\n" +
            "title : 文字を入力してください" + "\n" +
            "description : 文字を入力してください" + "\n" +
            "image : URLを入力してください" + "\n" +
            "display : プロフィールが表示されます";
    }

    color(text) {
        if(text.match(/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)){   //#は使わない
            this.profile.color = text;
        } else {
            this.replyMessage = '値が間違っています\n 例: 0099ff または AAA';
        }
    }

    title(text) {
        this.profile.title = text;
    }

    description(text) {
        this.profile.description = text;
    }

    image(text) {
        if(isUrl(text)){
            this.profile.image.url = text;
        }else{
            this.replyMessage = '正しいurlを入力してください';
        }
    }

    notfound(name) {
        this.replyMessage = `${name}オプションは存在しません。\nオプション例: color, title, description, image`;
    }

    avatarUrl() {
        return this.message.author.avatarURL() ?? 'https://cdn.discordapp.com/embed/avatars/0.png';
    }

    async embed() {
        return await new Discord.MessageEmbed()
            .setAuthor({
                // displayNameだとnicknameも考慮してくれる
                name: `${this.message.member.displayName}`,
                iconURL: this.avatarUrl(),
            })
            .setTitle(this.profile.title)
            .setColor(this.profile.color)
            .setDescription(this.profile.description)
            .setImage(this.profile.image.url)
            .setThumbnail(this.avatarUrl())
            .setTimestamp()
    }

    async send() {
        const embed = await this.embed();

        // もし付加的なメッセージがあれば送信
        if(this.replyMessage !== '') {
            this.message.channel.send(this.replyMessage);
        }

        // 表示して削除
        const reply = await this.message.channel.send({ embeds: [embed] });
        if( this.willDeleteMessage ) {
            await setTimeout(5000);
            await this.message.delete();
            await reply.delete();
        }
    }
}

const handler = async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(`${prefix}pf`)) return;

    let [subcmdName, text] = splitSubcommandText(message.content);

    const subcmd = new ProfileEmbedCommand(message);
    await subcmd.loadProfile();
    subcmd.run(subcmdName, text);
    await subcmd.writeProfile();
    await subcmd.send();
}

module.exports = {event, handler};

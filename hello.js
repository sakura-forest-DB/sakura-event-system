const fortunes = ['大吉', '中吉', '小吉', '凶'];
const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
console.log(`今日の運勢: ${randomFortune}`);

if (randomFortune === '大吉') {
    console.log('【今日はいい日だ】');
}
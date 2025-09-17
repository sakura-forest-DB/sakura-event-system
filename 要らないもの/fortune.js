import { Lunar, Solar } from 'lunar-javascript';

const now = new Date();
const solar = Solar.fromDate(now);
const lunar = solar.getLunar();

// 六曜の計算: 旧暦月日の合計を6で割った余り
const rokuyou = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'];
const rokuyouIndex = (lunar.getMonth() + lunar.getDay()) % 6;
const todayRokuyou = rokuyou[rokuyouIndex];

console.log('Hello! Nozomi');
console.log(now.toLocaleString('ja-JP'));
console.log(`今日の六曜: ${todayRokuyou}`);
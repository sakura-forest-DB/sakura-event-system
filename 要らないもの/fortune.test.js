import { Solar } from 'lunar-javascript';
import { strict as assert } from 'assert';

const six = new Set(['大安','赤口','先勝','友引','先負','仏滅']);
const lunar = Solar.fromDate(new Date()).getLunar();

// 六曜の正しい計算
const rokuyou = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'];
const rokuyouIndex = (lunar.getMonth() + lunar.getDay()) % 6;
const day = rokuyou[rokuyouIndex];

assert.ok(six.has(day), '六曜が不正: ' + day);
console.log('OK: 六曜は有効です →', day);

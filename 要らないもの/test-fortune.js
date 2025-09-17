import { Lunar, Solar } from 'lunar-javascript';

// 簡単なテスト: 今日の日付で例外が出ないことを確認
try {
    const now = new Date();
    const solar = Solar.fromDate(now);
    const lunar = solar.getLunar();
    
    const rokuyou = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'];
    const rokuyouIndex = (lunar.getMonth() + lunar.getDay()) % 6;
    const todayRokuyou = rokuyou[rokuyouIndex];
    
    console.log('✅ Test passed: No exceptions thrown');
    console.log(`今日 (${now.toLocaleDateString('ja-JP')}) の六曜: ${todayRokuyou}`);
    console.log(`旧暦: ${lunar.getYear()}年${lunar.getMonth()}月${lunar.getDay()}日`);
} catch (error) {
    console.log('❌ Test failed:', error.message);
    process.exit(1);
}
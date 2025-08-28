import express from 'express';
const router = express.Router();

// ホームページ
router.get('/', async (req, res) => {
  try {
    const prisma = req.prisma;
    

    // 募集中のイベント
    const currentDate = new Date();
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: currentDate
        }
      },
      orderBy: { date: 'asc' },
      take: 3
    });

    // 申込可能かどうかを各イベントに追加
    const upcomingEvents = events.map(event => ({
      ...event,
      canApply: !event.applicationStartDate || event.applicationStartDate <= currentDate,
      applicationStartMessage: event.applicationStartDate && event.applicationStartDate > currentDate 
        ? `申込開始: ${event.applicationStartDate.toLocaleDateString('ja-JP')}から`
        : null
    }));

    res.render('home', {
      title: '菊名桜山公園 ボランティア募集',
      upcomingEvents
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'データの取得中にエラーが発生しました'
    });
  }
});

export default router;
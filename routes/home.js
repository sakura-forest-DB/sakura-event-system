import express from 'express';
const router = express.Router();

// ホームページ
router.get('/', async (req, res) => {
  try {
    const prisma = req.prisma;          // 既存の仕組みをそのまま利用
    const currentDate = new Date();

    // 募集中のみ（公開 && OPEN && 未来日）
    const events = await prisma.event.findMany({
      where: {
        AND: [
          { date: { gte: currentDate } },
          { isPublic: true },
          { status: 'OPEN' }
        ]
      },
      orderBy: { date: 'asc' },
      take: 3
    });

    const upcomingEvents = events.map(event => ({
      ...event,
      canApply:
        !event.applicationStartDate ||
        event.applicationStartDate <= currentDate,
      applicationStartMessage:
        event.applicationStartDate &&
        event.applicationStartDate > currentDate
          ? `申込開始: ${event.applicationStartDate.toLocaleDateString('ja-JP')}から`
          : null
    }));

    res.render('home', {
      title: '菊名桜山公園 ボランティア募集',
      upcomingEvents
    });
  } catch (error) {
    console.error('[home] load error:', error);
    res.status(500).render('error', {
      title: 'エラー',
      message: 'イベント一覧の取得に失敗しました。',
      error: { status: 500 }
    });
  }
});

export default router;

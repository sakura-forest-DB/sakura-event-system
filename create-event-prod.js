import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  async function createEvent() {
    try {
      console.log('Creating event...');

      const event = await prisma.event.create({
        data: {
          title: 'Forest Christmas 2025',
          slug: '2025-12-14-forest-xmas',
          date: new Date('2025-12-14'),
          applicationStartDate: new Date('2025-10-15'),
          location: '菊名桜山公園',
          description:
  '2025年12月14日開催のクリスマスイベント',
          isPublic: true,
          status: 'OPEN'
        }
      });

      console.log('✅ Event created successfully:', event);

    } catch (error) {
      if (error.code === 'P2002') {
        console.log('✅ Event already exists');

        // 既存イベントを更新
        const updated = await prisma.event.update({
          where: { slug: '2025-12-14-forest-xmas' },
          data: {
            applicationStartDate: new Date('2025-10-15'),
            isPublic: true,
            status: 'OPEN'
          }
        });
        console.log('✅ Event updated:', updated);

      } else {
        console.error('❌ Error:', error);
      }
    } finally {
      await prisma.$disconnect();
    }
  }

  createEvent();

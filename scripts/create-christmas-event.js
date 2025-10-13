// scripts/create-christmas-event.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createChristmasEvent() {
  try {
    console.log('🎄 Creating Forest Christmas 2025 event...');

    // Check if event already exists
    const existingEvent = await prisma.event.findUnique({
      where: { slug: 'forest-christmas-2025' }
    });

    if (existingEvent) {
      console.log('✅ Forest Christmas 2025 event already exists!');
      console.log('Event ID:', existingEvent.id);
      console.log('Event Title:', existingEvent.title);
      console.log('Event Date:', existingEvent.date);
      console.log('Status:', existingEvent.status);
      console.log('Public:', existingEvent.isPublic);
      return existingEvent;
    }

    // Create new event
    const event = await prisma.event.create({
      data: {
        title: 'Forest Christmas 2025',
        slug: 'forest-christmas-2025',
        date: new Date('2025-12-21T10:00:00+09:00'), // 2025年12月21日 10:00
        applicationStartDate: new Date('2025-10-01T00:00:00+09:00'), // 2025年10月1日から受付開始
        location: '菊名桜山公園',
        description: '菊名桜山公園で開催される特別なクリスマスイベントです。地域の皆様と一緒に素敵な時間を過ごしましょう。出店・出演の募集を行っています。',
        isPublic: true,
        status: 'OPEN'
      }
    });

    console.log('✅ Successfully created Forest Christmas 2025 event!');
    console.log('Event ID:', event.id);
    console.log('Event Title:', event.title);
    console.log('Event Slug:', event.slug);
    console.log('Event Date:', event.date);
    console.log('Application Start:', event.applicationStartDate);
    console.log('Location:', event.location);
    console.log('Status:', event.status);
    console.log('Public:', event.isPublic);

    return event;
  } catch (error) {
    console.error('❌ Error creating event:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createChristmasEvent();

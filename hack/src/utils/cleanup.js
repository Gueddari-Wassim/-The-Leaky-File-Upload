const fs = require('fs');
const cron = require('node-cron');
const prisma = require('../config/prisma');

async function purgeExpiredFiles() {
  const now = new Date();

  const expired = await prisma.storedFile.findMany({
    where: { expiresAt: { lte: now } },
  });

  if (expired.length === 0) return;

  console.log(`[cleanup] Found ${expired.length} expired file(s). Purging…`);

  for (const file of expired) {
    try {
      if (fs.existsSync(file.storagePath)) {
        fs.unlinkSync(file.storagePath);
      }
    } catch (fsErr) {
      console.error(`[cleanup] Failed to delete ${file.storagePath}:`, fsErr.message);
    }

    await prisma.storedFile.delete({ where: { id: file.id } });
  }

  console.log(`[cleanup] Purged ${expired.length} file(s).`);
}


function startCleanupScheduler() {
  purgeExpiredFiles().catch((err) =>
    console.error('[cleanup] Initial purge failed:', err)
  );

  cron.schedule('0 * * * *', () => {
    purgeExpiredFiles().catch((err) =>
      console.error('[cleanup] Scheduled purge failed:', err)
    );
  });

  console.log('[cleanup] Scheduler started – runs every hour.');
}
module.exports = { startCleanupScheduler, purgeExpiredFiles };
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../config/prisma');

const SIGNATURES = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
  'image/webp': [], 
};

function validateMagicBytes(filePath, mimeType) {
  const buf = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);

  // Special RIFF/WEBP check
  if (mimeType === 'image/webp') {
    return (
      buf.slice(0, 4).toString('ascii') === 'RIFF' &&
      buf.slice(8, 12).toString('ascii') === 'WEBP'
    );
  }

  const sigs = SIGNATURES[mimeType];
  if (!sigs || sigs.length === 0) return false;

  return sigs.some((sig) => buf.slice(0, sig.length).equals(sig));
}


function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function processUpload(file, userId) {
  const filePath = file.path;

  if (!validateMagicBytes(filePath, file.mimetype)) {
    fs.unlinkSync(filePath); // remove suspicious file immediately
    const err = new Error(
      'File content does not match its declared type. Upload rejected.'
    );
    err.code = 'INVALID_FILE_CONTENT';
    throw err;
  }

  const hash = await hashFile(filePath);
  const existing = await prisma.storedFile.findUnique({ where: { hash } });

  let storedFile;
  let deduplicated = false;

  if (existing) {
    fs.unlinkSync(filePath);
    deduplicated = true;

    storedFile = await prisma.storedFile.update({
      where: { id: existing.id },
      data: { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
  } else {
    storedFile = await prisma.storedFile.create({
      data: {
        hash,
        storagePath: filePath,
        size: file.size,
        mimeType: file.mimetype,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  const uploadRef = await prisma.uploadRef.create({
    data: {
      userId,
      originalName: file.originalname,
      storedFileId: storedFile.id,
    },
  });

  return { uploadRef, storedFile, deduplicated };
}
module.exports = { processUpload };
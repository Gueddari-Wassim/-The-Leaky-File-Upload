const { processUpload } = require('../services/upload.service');

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please attach a file under the "file" field.',
      });
    }

    const userId = req.body.userId || 'anonymous';

    const { uploadRef, storedFile, deduplicated } = await processUpload(
      req.file,
      userId
    );

    return res.status(201).json({
      success: true,
      message: deduplicated
        ? 'File already existed — reusing stored copy.'
        : 'File uploaded successfully.',
      data: {
        uploadId: uploadRef.id,
        originalName: uploadRef.originalName,
        size: storedFile.size,
        mimeType: storedFile.mimeType,
        expiresAt: storedFile.expiresAt,
        deduplicated,
      },
    });
  } catch (err) {
    if (err.code === 'INVALID_FILE_CONTENT') {
      return res.status(415).json({ success: false, message: err.message });
    }
    console.error('Upload error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during upload.',
    });
  }
}
module.exports = { uploadFile };
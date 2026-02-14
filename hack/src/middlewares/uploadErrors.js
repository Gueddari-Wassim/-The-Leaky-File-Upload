const multer = require('multer');

function handleUploadErrors(fieldName) {
  return (req, res, next) => {
    const { upload } = require('./upload');
    const singleUpload = upload.single(fieldName);

    singleUpload(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File too large. Maximum allowed size is 5 MB.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      if (err.code === 'UNSUPPORTED_MEDIA_TYPE') {
        return res.status(415).json({
          success: false,
          message: err.message,
        });
      }

      console.error('Unexpected upload error:', err);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred during upload.',
      });
    });
  };
}

module.exports = { handleUploadErrors };
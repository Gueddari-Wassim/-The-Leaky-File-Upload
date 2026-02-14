const { Router } = require('express');
const { handleUploadErrors } = require('../middlewares/uploadErrors');
const { uploadFile } = require('../controllers/upload.controller');

const router = Router();

router.post('/', handleUploadErrors('file'), uploadFile);

module.exports = router;

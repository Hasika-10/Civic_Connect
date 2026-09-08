const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Saves an uploaded file buffer to the appropriate storage provider:
 * 1. Vercel Blob (if BLOB_READ_WRITE_TOKEN is set)
 * 2. Local disk (or /tmp on Vercel if no cloud storage token is provided)
 *
 * @param {Object} file - Express multer file object (with buffer)
 * @returns {Promise<string>} - The public image URL or relative path (e.g. /uploads/uuid.jpg)
 */
async function saveFile(file) {
  if (!file || !file.buffer) {
    throw new Error('Invalid file: buffer is required');
  }

  const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
  const filename = `${uuidv4()}${ext}`;

  // 1. If Vercel Blob is configured, upload to cloud storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = require('@vercel/blob');
      const blob = await put(`uploads/${filename}`, file.buffer, {
        access: 'public',
        contentType: file.mimetype || 'image/jpeg'
      });
      return blob.url;
    } catch (err) {
      console.warn('Vercel Blob upload failed, falling back to local/tmp storage:', err.message);
    }
  }

  // 2. Local disk storage (or /tmp on Vercel)
  const targetDir = process.env.VERCEL
    ? path.join('/tmp', 'uploads')
    : path.join(__dirname, '..', '..', 'uploads');

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetPath = path.join(targetDir, filename);
    fs.writeFileSync(targetPath, file.buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Failed to write file to disk:', err.message);
    // Ultimate fallback: return base64 data URI so the image never breaks
    const base64 = file.buffer.toString('base64');
    const mime = file.mimetype || 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  }
}

/**
 * Saves multiple file buffers and returns array of image paths/URLs
 * @param {Array<Object>} files - Array of multer file objects
 * @returns {Promise<Array<string>>}
 */
async function saveFiles(files) {
  if (!files || !Array.isArray(files)) return [];
  const results = [];
  for (const file of files) {
    const url = await saveFile(file);
    results.push(url);
  }
  return results;
}

module.exports = {
  saveFile,
  saveFiles
};

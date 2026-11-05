const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Memory storage for uploads to ensure no uninspected files hit disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB maximum file size limit
  }
});

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  '.py', '.mql5', '.mq5', '.mqh', '.csv', '.json', '.txt',
  '.log', '.pdf', '.md', '.markdown', '.js', '.ts', '.html', '.css'
]);

// 1. List user projects
router.get('/', authMiddleware, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, COUNT(f.id) as file_count
      FROM projects p
      LEFT JOIN project_files f ON p.id = f.project_id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `).all(req.user.id);

    return res.json({ projects });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

// 2. Create project
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description, systemInstructions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO projects (id, user_id, name, description, system_instructions)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      projectId,
      req.user.id,
      name.trim(),
      description?.trim() || null,
      systemInstructions?.trim() || null
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    return res.status(201).json({ project });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

// 3. Get project with associated files
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = db.prepare(`
      SELECT id, filename, file_type, file_size, created_at, SUBSTR(content_text, 1, 500) as preview
      FROM project_files
      WHERE project_id = ? AND user_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id, req.user.id);

    return res.json({ project, files });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// 4. Update project instructions or name
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, description, systemInstructions } = req.body;
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.prepare(`
      UPDATE projects
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          system_instructions = COALESCE(?, system_instructions),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(name?.trim() || null, description?.trim() || null, systemInstructions?.trim() || null, req.params.id, req.user.id);

    const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    return res.json({ project: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// 5. Upload files to a project (or standalone chat attachment)
router.post('/:id/files', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    const projectId = req.params.id;
    // Verify project belongs to user
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
      .get(projectId, req.user.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const insertedFiles = [];

    for (const file of req.files) {
      const ext = '.' + file.originalname.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({ error: `File type ${ext} is not supported.` });
      }

      let parsedText = '';
      if (ext === '.pdf') {
        try {
          const pdfData = await pdfParse(file.buffer);
          parsedText = pdfData.text || '';
        } catch (pdfErr) {
          console.error('PDF Parse error:', pdfErr);
          parsedText = '[Could not extract text from PDF document]';
        }
      } else {
        // Plaintext / source code / CSV / JSON
        parsedText = file.buffer.toString('utf-8');
      }

      // Safe truncate if unreasonably huge (e.g. > 500,000 characters)
      if (parsedText.length > 500000) {
        parsedText = parsedText.substring(0, 500000) + '\n\n[TRUNCATED: File exceeds 500,000 character context safety window]';
      }

      const fileId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO project_files (id, project_id, user_id, filename, file_type, file_size, content_text)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        projectId,
        req.user.id,
        file.originalname,
        ext.replace('.', ''),
        file.size,
        parsedText
      );

      insertedFiles.push({
        id: fileId,
        filename: file.originalname,
        fileType: ext.replace('.', ''),
        fileSize: file.size,
        preview: parsedText.substring(0, 300)
      });
    }

    return res.status(201).json({
      success: true,
      files: insertedFiles
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'File upload processing failed' });
  }
});

// 6. Delete file
router.delete('/:projectId/files/:fileId', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM project_files WHERE id = ? AND project_id = ? AND user_id = ?')
      .run(req.params.fileId, req.params.projectId, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    return res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

// 7. Standalone transient file inspection for Chat Composer
router.post('/inspect-file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const ext = '.' + req.file.originalname.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({ error: `File type ${ext} is not supported.` });
    }

    let parsedText = '';
    if (ext === '.pdf') {
      try {
        const pdfData = await pdfParse(req.file.buffer);
        parsedText = pdfData.text || '';
      } catch (e) {
        parsedText = '[Could not extract text from PDF document]';
      }
    } else {
      parsedText = req.file.buffer.toString('utf-8');
    }

    if (parsedText.length > 500000) {
      parsedText = parsedText.substring(0, 500000) + '\n\n[TRUNCATED: File exceeds context limit]';
    }

    return res.json({
      filename: req.file.originalname,
      fileType: ext.replace('.', ''),
      size: req.file.size,
      text: parsedText
    });
  } catch (err) {
    return res.status(500).json({ error: 'Transient file parsing failed' });
  }
});

module.exports = router;

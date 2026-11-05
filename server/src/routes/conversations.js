const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 1. List all conversations for authenticated user (pinned first, then recent)
router.get('/', authMiddleware, (req, res) => {
  try {
    const { projectId, search } = req.query;

    let query = `
      SELECT id, project_id, title, model_id, provider_id, access_method, pinned, created_at, updated_at
      FROM conversations
      WHERE user_id = ?
    `;
    const params = [req.user.id];

    if (projectId) {
      query += ` AND project_id = ?`;
      params.push(projectId);
    }

    if (search) {
      query += ` AND title LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY pinned DESC, updated_at DESC LIMIT 100`;

    const conversations = db.prepare(query).all(...params);
    return res.json({ conversations });
  } catch (err) {
    console.error('List conversations error:', err);
    return res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

// 2. Create new conversation
router.post('/', authMiddleware, (req, res) => {
  try {
    const { title, modelId, providerId, accessMethod, projectId } = req.body;
    const conversationId = crypto.randomUUID();

    const finalTitle = title?.trim() || 'New Conversation';
    const finalModel = modelId || 'gpt-4o-mini';
    const finalProvider = providerId || 'puter';
    const finalAccess = accessMethod || 'puter';

    db.prepare(`
      INSERT INTO conversations (id, user_id, project_id, title, model_id, provider_id, access_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(conversationId, req.user.id, projectId || null, finalTitle, finalModel, finalProvider, finalAccess);

    const created = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    return res.status(201).json({ conversation: created });
  } catch (err) {
    console.error('Create conversation error:', err);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// 3. Get single conversation with full message history (verifying ownership)
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    const messages = db.prepare(`
      SELECT id, role, content, model_id, provider_id, tokens_in, tokens_out, duration_ms, error, attachments_json, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id);

    // Parse attachments json if present
    const parsedMessages = messages.map(m => ({
      ...m,
      attachments: m.attachments_json ? JSON.parse(m.attachments_json) : []
    }));

    return res.json({
      conversation,
      messages: parsedMessages
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch conversation details' });
  }
});

// 4. Update conversation (Rename, Pin/Unpin, Model switch)
router.patch('/:id', authMiddleware, (req, res) => {
  try {
    const { title, pinned, modelId, providerId, accessMethod, projectId } = req.body;

    const existing = db.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (pinned !== undefined) {
      updates.push('pinned = ?');
      params.push(pinned ? 1 : 0);
    }
    if (modelId !== undefined) {
      updates.push('model_id = ?');
      params.push(modelId);
    }
    if (providerId !== undefined) {
      updates.push('provider_id = ?');
      params.push(providerId);
    }
    if (accessMethod !== undefined) {
      updates.push('access_method = ?');
      params.push(accessMethod);
    }
    if (projectId !== undefined) {
      updates.push('project_id = ?');
      params.push(projectId);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id, req.user.id);
      db.prepare(`
        UPDATE conversations
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `).run(...params);
    }

    const updated = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    return res.json({ conversation: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// 5. Append message to conversation (Verifies user owns conversation)
router.post('/:id/messages', authMiddleware, (req, res) => {
  try {
    const { role, content, modelId, providerId, tokensIn, tokensOut, durationMs, attachments } = req.body;

    const conversation = db.prepare('SELECT id, title FROM conversations WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    if (!role || !content) {
      return res.status(400).json({ error: 'role and content are required' });
    }

    const messageId = crypto.randomUUID();
    const attachmentsJson = attachments && Array.isArray(attachments) ? JSON.stringify(attachments) : null;

    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, model_id, provider_id, tokens_in, tokens_out, duration_ms, attachments_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      messageId,
      req.params.id,
      role,
      content,
      modelId || null,
      providerId || null,
      tokensIn || 0,
      tokensOut || 0,
      durationMs || 0,
      attachmentsJson
    );

    // Auto-generate conversation title from first user prompt if still default
    if (role === 'user' && (conversation.title === 'New Conversation' || !conversation.title)) {
      const autoTitle = content.slice(0, 40).replace(/[\r\n]+/g, ' ').trim() + (content.length > 40 ? '...' : '');
      db.prepare('UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(autoTitle, req.params.id);
    } else {
      db.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(req.params.id);
    }

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
    return res.status(201).json({
      message: {
        ...message,
        attachments: attachmentsJson ? JSON.parse(attachmentsJson) : []
      }
    });
  } catch (err) {
    console.error('Append message error:', err);
    return res.status(500).json({ error: 'Failed to save message' });
  }
});

// 6. Delete conversation
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized' });
    }

    return res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// 7. Export conversation as Markdown or JSON
router.get('/:id/export', authMiddleware, (req, res) => {
  try {
    const { format } = req.query; // 'markdown' or 'json'
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(req.params.id);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="nexora-chat-${conversation.id}.json"`);
      return res.json({ conversation, messages });
    }

    // Default to Markdown
    let md = `# ${conversation.title}\n`;
    md += `*Exported from NEXORA AI on ${new Date().toISOString()}*\n`;
    md += `*Model: ${conversation.model_id} (${conversation.provider_id})*\n\n---\n\n`;

    for (const msg of messages) {
      const header = msg.role === 'user' ? '### 👤 User' : '### 🤖 Assistant';
      md += `${header} (${msg.created_at})\n\n${msg.content}\n\n---\n\n`;
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nexora-chat-${conversation.id}.md"`);
    return res.send(md);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export conversation' });
  }
});

module.exports = router;

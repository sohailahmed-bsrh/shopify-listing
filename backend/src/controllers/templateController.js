import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/db.js';

export async function getTemplates(req, res) {
  const db = getDb();
  if (db.isLive()) {
    try {
      const [rows] = await db.pool().query('SELECT * FROM listing_templates ORDER BY created_at DESC');
      return res.json({ success: true, templates: rows });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.json({ success: true, templates: db.memory.templates });
}

export async function createTemplate(req, res) {
  const { name, description_template, default_vendor, default_tags, policy_snippet, size_chart_html } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Template name is required' });

  const id = uuidv4();
  const db = getDb();

  if (db.isLive()) {
    try {
      await db.pool().query(
        `INSERT INTO listing_templates (id, name, description_template, default_vendor, default_tags, policy_snippet, size_chart_html)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, description_template, default_vendor, default_tags, policy_snippet, size_chart_html]
      );
      return res.json({ success: true, template: { id, name, description_template, default_vendor, default_tags, policy_snippet, size_chart_html } });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const newTmpl = { id, name, description_template, default_vendor, default_tags, policy_snippet, size_chart_html };
  db.memory.templates.push(newTmpl);
  return res.json({ success: true, template: newTmpl });
}

export async function deleteTemplate(req, res) {
  const { id } = req.params;
  const db = getDb();

  if (db.isLive()) {
    try {
      await db.pool().query('DELETE FROM listing_templates WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Template deleted' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  db.memory.templates = db.memory.templates.filter(t => t.id !== id);
  return res.json({ success: true, message: 'Template deleted' });
}

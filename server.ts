import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initDb } from './src/db.js';
import db from './src/db.js';
import { GoogleGenAI } from "@google/genai";
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Initialize Database
initDb();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const isValidScore = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

// API Routes

// --- Users ---
app.post('/api/users', (req, res) => {
  const { name, email, avatar, academic_bg, professional_history, skills } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, avatar, academic_bg, professional_history) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, email, avatar, academic_bg, professional_history);
    const userId = info.lastInsertRowid;

    if (skills && Array.isArray(skills)) {
      const skillStmt = db.prepare('INSERT INTO user_skills (user_id, skill_name, category) VALUES (?, ?, ?)');
      for (const skill of skills) {
        skillStmt.run(userId, skill.name, skill.category);
      }
    }
    
    res.json({ id: userId, message: 'User created successfully' });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(409).json({ error: 'Este email já está cadastrado.' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    const usersWithSkills = users.map((user: any) => {
      const skills = db.prepare('SELECT skill_name as name, category FROM user_skills WHERE user_id = ?').all(user.id);
      return { ...user, skills };
    });
    res.json(usersWithSkills);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:email', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.params.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const skills = db.prepare('SELECT skill_name as name, category FROM user_skills WHERE user_id = ?').all((user as any).id);
    res.json({ ...user, skills });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  const { name, avatar, academic_bg, professional_history, skills } = req.body;
  const userId = req.params.id;

  try {
    const stmt = db.prepare('UPDATE users SET name = ?, avatar = ?, academic_bg = ?, professional_history = ? WHERE id = ?');
    stmt.run(name, avatar, academic_bg, professional_history, userId);

    if (skills && Array.isArray(skills)) {
      // Delete existing skills
      db.prepare('DELETE FROM user_skills WHERE user_id = ?').run(userId);
      
      // Insert new skills
      const skillStmt = db.prepare('INSERT INTO user_skills (user_id, skill_name, category) VALUES (?, ?, ?)');
      for (const skill of skills) {
        skillStmt.run(userId, skill.name, skill.category);
      }
    }
    
    // Fetch updated user
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const updatedSkills = db.prepare('SELECT skill_name as name, category FROM user_skills WHERE user_id = ?').all(userId);
    
    res.json({ ...updatedUser, skills: updatedSkills });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Groups ---
app.post('/api/groups', (req, res) => {
  const { name, description, admin_id } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO groups (name, description, admin_id) VALUES (?, ?, ?)');
    const info = stmt.run(name, description, admin_id);
    
    // Add admin as member
    db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(info.lastInsertRowid, admin_id, 'Admin');
    
    res.json({ id: info.lastInsertRowid, message: 'Group created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/groups', (req, res) => {
    const groups = db.prepare('SELECT * FROM groups').all();
    res.json(groups);
});

app.post('/api/groups/:id/members', (req, res) => {
  const { user_id, role } = req.body;
  const groupId = Number(req.params.id);
  const userId = Number(user_id);

  if (!Number.isInteger(groupId) || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'group_id e user_id inválidos.' });
  }

  try {
    db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(groupId, userId, role || 'Member');
    res.json({ message: 'Member added' });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed: group_members.group_id, group_members.user_id')) {
      return res.status(409).json({ error: 'Este usuário já faz parte do grupo.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// --- Ideas ---
app.post('/api/ideas', (req, res) => {
  const { title, description, area, author_id, group_id } = req.body;
  const normalizedTitle = String(title || '').trim();
  const normalizedDescription = String(description || '').trim();
  const normalizedArea = String(area || '').trim();
  const authorId = Number(author_id);
  const groupId = group_id == null ? null : Number(group_id);

  if (!normalizedTitle || !normalizedDescription || !normalizedArea) {
    return res.status(400).json({ error: 'Título, descrição e área são obrigatórios.' });
  }
  if (!Number.isInteger(authorId)) {
    return res.status(400).json({ error: 'author_id inválido.' });
  }
  if (groupId !== null && !Number.isInteger(groupId)) {
    return res.status(400).json({ error: 'group_id inválido.' });
  }

  try {
    const stmt = db.prepare('INSERT INTO ideas (title, description, area, author_id, group_id) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(normalizedTitle, normalizedDescription, normalizedArea, authorId, groupId);
    res.json({ id: info.lastInsertRowid, message: 'Idea registered' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ideas', (req, res) => {
  const ideas = db.prepare(`
    SELECT ideas.*, users.name as author_name, 
    (SELECT AVG((impact + viability + innovation)/3.0) FROM votes WHERE votes.idea_id = ideas.id) as score
    FROM ideas 
    JOIN users ON ideas.author_id = users.id
  `).all();
  res.json(ideas);
});

app.post('/api/ideas/:id/improvements', (req, res) => {
  const { author_id, description } = req.body;
  const ideaId = Number(req.params.id);
  const authorId = Number(author_id);
  const normalizedDescription = String(description || '').trim();

  if (!Number.isInteger(ideaId)) {
    return res.status(400).json({ error: 'idea_id inválido.' });
  }
  if (!Number.isInteger(authorId)) {
    return res.status(400).json({ error: 'author_id inválido.' });
  }
  if (!normalizedDescription) {
    return res.status(400).json({ error: 'Descrição da melhoria é obrigatória.' });
  }

  try {
    db.prepare('INSERT INTO idea_improvements (idea_id, author_id, description) VALUES (?, ?, ?)').run(ideaId, authorId, normalizedDescription);
    res.json({ message: 'Improvement added' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ideas/:id/improvements', (req, res) => {
    const improvements = db.prepare(`
        SELECT ii.*, u.name as author_name 
        FROM idea_improvements ii 
        JOIN users u ON ii.author_id = u.id 
        WHERE ii.idea_id = ?
    `).all(req.params.id);
    res.json(improvements);
});

app.post('/api/ideas/:id/vote', (req, res) => {
  const { user_id, impact, viability, innovation } = req.body;
  const ideaId = Number(req.params.id);
  const userId = Number(user_id);
  const impactScore = Number(impact);
  const viabilityScore = Number(viability);
  const innovationScore = Number(innovation);

  if (!Number.isInteger(ideaId) || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'idea_id e user_id devem ser números inteiros.' });
  }
  if (!isValidScore(impactScore) || !isValidScore(viabilityScore) || !isValidScore(innovationScore)) {
    return res.status(400).json({ error: 'As notas devem estar entre 1 e 5.' });
  }

  try {
    db.prepare(`
      INSERT INTO votes (idea_id, user_id, impact, viability, innovation) 
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(idea_id, user_id) DO UPDATE SET
      impact=excluded.impact, viability=excluded.viability, innovation=excluded.innovation
    `).run(ideaId, userId, impactScore, viabilityScore, innovationScore);
    res.json({ message: 'Vote recorded' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ideas/:id/promote', (req, res) => {
  const ideaId = Number(req.params.id);
  const objective = req.body?.objective ? String(req.body.objective).trim() : null;

  if (!Number.isInteger(ideaId)) {
    return res.status(400).json({ error: 'idea_id inválido.' });
  }

  try {
    const idea = db.prepare('SELECT id, status FROM ideas WHERE id = ?').get(ideaId) as { id: number; status: string } | undefined;
    if (!idea) {
      return res.status(404).json({ error: 'Ideia não encontrada.' });
    }

    const scoreRow = db.prepare(`
      SELECT AVG((impact + viability + innovation)/3.0) as score
      FROM votes
      WHERE idea_id = ?
    `).get(ideaId) as { score: number | null };

    if (!scoreRow?.score || scoreRow.score < 4) {
      return res.status(400).json({ error: 'A ideia precisa de nota média mínima 4.0 para ser promovida.' });
    }

    db.prepare(`UPDATE ideas SET status = 'project' WHERE id = ?`).run(ideaId);
    db.prepare('INSERT OR IGNORE INTO projects (idea_id, objective) VALUES (?, ?)').run(ideaId, objective);

    res.json({ message: 'Ideia promovida para projeto com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI Features ---
app.post('/api/ai/suggest-team', async (req, res) => {
  const { project_description, count = 3 } = req.body;
  const normalizedProjectDescription = String(project_description || '').trim();
  const candidateCount = Number(count);

  if (!normalizedProjectDescription) {
    return res.status(400).json({ error: 'project_description é obrigatório.' });
  }
  if (!Number.isInteger(candidateCount) || candidateCount < 1 || candidateCount > 10) {
    return res.status(400).json({ error: 'count deve ser um número entre 1 e 10.' });
  }
  
  try {
    // Fetch all users and their skills
    const users = db.prepare('SELECT * FROM users').all();
    const usersWithSkills = users.map((user: any) => {
      const skills = db.prepare('SELECT skill_name as name, category FROM user_skills WHERE user_id = ?').all(user.id);
      return { ...user, skills };
    });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      I need to form a team for the following project: "${normalizedProjectDescription}".
      
      Here is the pool of available users with their skills:
      ${JSON.stringify(usersWithSkills, null, 2)}
      
      Please select the best ${candidateCount} candidates for this project.
      For each candidate, explain why they were chosen and suggest a specific role.
      
      Return the response in JSON format with the following structure:
      {
        "candidates": [
          {
            "user_id": 123,
            "name": "Name",
            "suggested_role": "Role Title",
            "reason": "Reason for selection"
          }
        ]
      }
    `;

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
    });
    
    const responseText = result.text;
    if (responseText) {
      res.json(JSON.parse(responseText));
    } else {
      res.status(500).json({ error: "No response from AI" });
    }

  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/assign-roles', async (req, res) => {
  const { project_description, team_members } = req.body; // team_members is array of user objects with skills
  const normalizedProjectDescription = String(project_description || '').trim();

  if (!normalizedProjectDescription) {
    return res.status(400).json({ error: 'project_description é obrigatório.' });
  }
  if (!Array.isArray(team_members) || team_members.length === 0) {
    return res.status(400).json({ error: 'team_members deve ser um array com ao menos 1 integrante.' });
  }
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      I have a team for the project: "${normalizedProjectDescription}".
      
      Team Members:
      ${JSON.stringify(team_members, null, 2)}
      
      Please assign a specific role and function to each team member based on their skills and the project needs.
      
      Return the response in JSON format:
      {
        "assignments": [
          {
            "user_id": 123,
            "role": "Role Title",
            "function": "Description of responsibilities"
          }
        ]
      }
    `;

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
    });
    
    const responseText = result.text;
    if (responseText) {
      res.json(JSON.parse(responseText));
    } else {
      res.status(500).json({ error: "No response from AI" });
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Vite Middleware
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // SPA fallback for client-side routes.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

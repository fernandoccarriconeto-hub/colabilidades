import express from 'express';
import { createServer as createViteServer } from 'vite';
import { initDb } from './src/db.js';
import db from './src/db.js';
import { GoogleGenAI } from "@google/genai";

// Initialize Database
initDb();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  try {
    db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user_id, role || 'Member');
    res.json({ message: 'Member added' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Ideas ---
app.post('/api/ideas', (req, res) => {
  const { title, description, area, author_id, group_id } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO ideas (title, description, area, author_id, group_id) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(title, description, area, author_id, group_id);
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
  try {
    db.prepare('INSERT INTO idea_improvements (idea_id, author_id, description) VALUES (?, ?, ?)').run(req.params.id, author_id, description);
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
  try {
    db.prepare(`
      INSERT INTO votes (idea_id, user_id, impact, viability, innovation) 
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(idea_id, user_id) DO UPDATE SET
      impact=excluded.impact, viability=excluded.viability, innovation=excluded.innovation
    `).run(req.params.id, user_id, impact, viability, innovation);
    res.json({ message: 'Vote recorded' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Projects ---
app.post('/api/projects', (req, res) => {
  const { idea_id, objective } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO projects (idea_id, objective) VALUES (?, ?)');
    const info = stmt.run(idea_id, objective);
    
    // Update idea status to 'project'
    db.prepare('UPDATE ideas SET status = "project" WHERE id = ?').run(idea_id);
    
    res.json({ id: info.lastInsertRowid, message: 'Project activated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects', (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, i.title, i.description, i.area, i.group_id, g.name as group_name
      FROM projects p
      JOIN ideas i ON p.idea_id = i.id
      LEFT JOIN groups g ON i.group_id = g.id
    `).all();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const project = db.prepare(`
      SELECT p.*, i.title, i.description, i.area, i.group_id, g.name as group_name
      FROM projects p
      JOIN ideas i ON p.idea_id = i.id
      LEFT JOIN groups g ON i.group_id = g.id
      WHERE p.id = ?
    `).get(req.params.id);
    
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    const tasks = db.prepare(`
      SELECT t.*, u.name as responsible_name, u.avatar as responsible_avatar
      FROM tasks t
      LEFT JOIN users u ON t.responsible_id = u.id
      WHERE t.project_id = ?
    `).all(req.params.id);
    
    // Get team members for assignment
    const members = db.prepare(`
      SELECT u.id, u.name, u.avatar, gm.role
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
    `).all((project as any).group_id);
    
    res.json({ ...project, tasks, members });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Tasks ---
app.post('/api/projects/:id/tasks', (req, res) => {
  const { title, description, responsible_id, status, position_x, position_y, color } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO tasks (project_id, title, description, responsible_id, status, position_x, position_y, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(req.params.id, title, description, responsible_id, status || 'pending', position_x || 0, position_y || 0, color || '#ffffff');
    res.json({ id: info.lastInsertRowid, message: 'Task created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  const { title, description, responsible_id, status, position_x, position_y, color } = req.body;
  try {
    const updates = [];
    const params = [];
    
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (responsible_id !== undefined) { updates.push('responsible_id = ?'); params.push(responsible_id); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (position_x !== undefined) { updates.push('position_x = ?'); params.push(position_x); }
    if (position_y !== undefined) { updates.push('position_y = ?'); params.push(position_y); }
    if (color !== undefined) { updates.push('color = ?'); params.push(color); }
    
    if (updates.length === 0) return res.json({ message: 'No updates' });
    
    params.push(req.params.id);
    
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ message: 'Task updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI Features ---
app.post('/api/ai/suggest-team', async (req, res) => {
  const { project_description, count = 3 } = req.body;
  
  try {
    // Fetch all users and their skills
    const users = db.prepare('SELECT * FROM users').all();
    const usersWithSkills = users.map((user: any) => {
      const skills = db.prepare('SELECT skill_name as name, category FROM user_skills WHERE user_id = ?').all(user.id);
      return { ...user, skills };
    });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      I need to form a team for the following project: "${project_description}".
      
      Here is the pool of available users with their skills:
      ${JSON.stringify(usersWithSkills, null, 2)}
      
      Please select the best ${count} candidates for this project.
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
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      I have a team for the project: "${project_description}".
      
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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

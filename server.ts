import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "vape_quit.db");
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    userData TEXT,
    planData TEXT,
    quitDate TEXT,
    avatar TEXT DEFAULT '👤',
    points INTEGER DEFAULT 0,
    maxPoints INTEGER DEFAULT 0,
    completedTasks TEXT DEFAULT '[]'
  )
`);

// Prepared Statements for Optimization
const registerStmt = db.prepare("INSERT INTO users (username, email, password, quitDate, avatar, points, maxPoints, completedTasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
const loginStmt = db.prepare("SELECT * FROM users WHERE username = ?");
const savePlanWithPointsStmt = db.prepare("UPDATE users SET userData = ?, planData = ?, quitDate = ?, points = ? WHERE id = ?");
const savePlanStmt = db.prepare("UPDATE users SET userData = ?, planData = ?, quitDate = ? WHERE id = ?");
const updateProfileStmt = db.prepare("UPDATE users SET avatar = ? WHERE id = ?");
const updateProgressStmt = db.prepare("UPDATE users SET points = ?, maxPoints = ?, completedTasks = ? WHERE id = ?");
const getUserStmt = db.prepare("SELECT * FROM users WHERE id = ?");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body;
    const quitDate = new Date().toISOString();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = registerStmt.run(username, email, hashedPassword, quitDate, '👤', 0, 0, '[]');
      res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: "El usuario o correo ya existe" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = loginStmt.get(username) as any;
      if (user && await bcrypt.compare(password, user.password)) {
        res.json({ 
          success: true, 
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            userData: user.userData ? JSON.parse(user.userData) : null,
            planData: user.planData ? JSON.parse(user.planData) : null,
            quitDate: user.quitDate,
            avatar: user.avatar || '👤',
            points: user.points || 0,
            maxPoints: user.maxPoints || 0,
            completedTasks: user.completedTasks ? JSON.parse(user.completedTasks) : []
          }
        });
      } else {
        res.status(401).json({ error: "Credenciales inválidas" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error en el servidor" });
    }
  });

  app.post("/api/save-plan", (req, res) => {
    const { userId, userData, planData, quitDate, points } = req.body;
    try {
      if (points !== undefined) {
        savePlanWithPointsStmt.run(JSON.stringify(userData), JSON.stringify(planData), quitDate, points, userId);
      } else {
        savePlanStmt.run(JSON.stringify(userData), JSON.stringify(planData), quitDate, userId);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Error al guardar el plan" });
    }
  });

  app.post("/api/update-profile", (req, res) => {
    const { userId, avatar } = req.body;
    try {
      updateProfileStmt.run(avatar, userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Error al actualizar el perfil" });
    }
  });

  app.post("/api/update-progress", (req, res) => {
    const { userId, points, maxPoints, completedTasks } = req.body;
    try {
      updateProgressStmt.run(points, maxPoints, JSON.stringify(completedTasks), userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Error al actualizar el progreso" });
    }
  });

  app.get("/api/user/:id", (req, res) => {
    const user = getUserStmt.get(req.params.id) as any;
    if (user) {
      res.json({
        username: user.username,
        email: user.email,
        userData: user.userData ? JSON.parse(user.userData) : null,
        planData: user.planData ? JSON.parse(user.planData) : null,
        quitDate: user.quitDate,
        avatar: user.avatar || '👤',
        points: user.points || 0,
        maxPoints: user.maxPoints || 0,
        completedTasks: user.completedTasks ? JSON.parse(user.completedTasks) : []
      });
    } else {
      res.status(404).json({ error: "Usuario no encontrado" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

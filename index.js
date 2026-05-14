const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// BASE DE DATOS EN MEMORIA (No requiere configuración)
let users = [];
let exercises = [];

// Crear usuario
app.post('/api/users', (req, res) => {
  const newUser = {
    username: req.body.username,
    _id: "id_" + Math.random().toString(36).substr(2, 9)
  };
  users.push(newUser);
  res.json(newUser);
});

// Listar usuarios
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Agregar ejercicio
app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  const user = users.find(u => u._id === id);

  if (!user) return res.json({ error: "User not found" });

  const exerciseDate = date ? new Date(date).toDateString() : new Date().toDateString();
  
  const exercise = {
    description,
    duration: Number(duration),
    date: exerciseDate
  };

  exercises.push({ ...exercise, user_id: id });

  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// Ver Logs
app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(u => u._id === req.params._id);
  if (!user) return res.json({ error: "User not found" });

  let log = exercises.filter(e => e.user_id === user._id);
  
  const { from, to, limit } = req.query;
  if (from) log = log.filter(e => new Date(e.date) >= new Date(from));
  if (to) log = log.filter(e => new Date(e.date) <= new Date(to));
  if (limit) log = log.slice(0, Number(limit));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log.map(({ description, duration, date }) => ({ description, duration, date }))
  });
});

app.listen(3000, () => console.log('¡SERVIDOR LISTO EN PUERTO 3000!'));
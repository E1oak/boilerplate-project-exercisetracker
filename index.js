const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// VARIABLES PARA GUARDAR DATOS (TEMPORAL)
let users = [];
let exercises = [];

// 1. Crear usuario
app.post('/api/users', (req, res) => {
  const newUser = {
    username: req.body.username,
    _id: Date.now().toString() // Genera un ID único basado en el tiempo
  };
  users.push(newUser);
  res.json(newUser);
});

// 2. Obtener usuarios
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. Agregar ejercicio
app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;
  const user = users.find(u => u._id === id);

  if (!user) return res.send("User not found");

  const exercise = {
    user_id: id,
    description,
    duration: Number(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  };

  exercises.push(exercise);

  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
  });
});

// 4. Obtener logs
app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params._id;
  const user = users.find(u => u._id === id);
  
  let userExercises = exercises.filter(e => e.user_id === id);
  
  // Filtros opcionales (from, to, limit)
  const { from, to, limit } = req.query;
  if (from) {
    const fromDate = new Date(from);
    userExercises = userExercises.filter(e => new Date(e.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    userExercises = userExercises.filter(e => new Date(e.date) <= toDate);
  }
  if (limit) {
    userExercises = userExercises.slice(0, Number(limit));
  }

  res.json({
    username: user.username,
    count: userExercises.length,
    _id: user._id,
    log: userExercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date
    }))
  });
});

app.listen(3000, () => console.log('Servidor listo en el puerto 3000'));
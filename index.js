const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

// Conexión a Base de Datos (Usa tu URI de MongoDB Atlas o local)
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-tracker');

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // Importante para leer formularios POST

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// --- MODELOS ---
const UserSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model('User', UserSchema);

const ExerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model('Exercise', ExerciseSchema);

// --- RUTAS ---

// 1. Crear usuario
app.post('/api/users', async (req, res) => {
  const userObj = new User({ username: req.body.username });
  try {
    const user = await userObj.save();
    res.json(user);
  } catch (err) {
    res.json({ error: "Error al guardar usuario" });
  }
});

// 2. Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('username _id');
  res.json(users);
});

// 3. Agregar ejercicio
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.send("Usuario no encontrado");

    const exerciseObj = new Exercise({
      user_id: id,
      description,
      duration: Number(duration),
      date: date ? new Date(date) : new Date()
    });

    const exercise = await exerciseObj.save();
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });
  } catch (err) {
    res.send("Error al guardar el ejercicio");
  }
});

// 4. Obtener logs (historial) con filtros
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) return res.send("Usuario no encontrado");

  let dateObj = {};
  if (from) dateObj["$gte"] = new Date(from);
  if (to) dateObj["$lte"] = new Date(to);

  let filter = { user_id: id };
  if (from || to) filter.date = dateObj;

  const exercises = await Exercise.find(filter).limit(+limit || 100);

  const log = exercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }));

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Tu app está escuchando en el puerto ' + listener.address().port);
});
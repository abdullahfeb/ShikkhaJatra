const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-quiz', (quizId) => {
    socket.join(quizId);
  });
  socket.on('submit-answer', (data) => {
    socket.to(data.quizId).emit('answer-submitted', data);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

mongoose.connect('mongodb://localhost:27017/shikkha-jatra', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => console.error('MongoDB error:', err));

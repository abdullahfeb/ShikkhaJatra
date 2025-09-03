const express = require('express');
const Quiz = require('../models/Quiz');
const { google } = require('googleapis');
const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { title, description, questions, courseId, timeLimit } = req.body;
    
    const quiz = new Quiz({
      title,
      description,
      questions,
      courseId,
      timeLimit,
      createdBy: req.user.id
    });
    
    await quiz.save();
    res.status(201).json({ message: 'Quiz created', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Error creating quiz', error: error.message });
  }
});

router.get('/course/:courseId', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId, isActive: true });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('courseId');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
});

module.exports = router;

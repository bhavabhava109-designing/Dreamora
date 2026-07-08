import express from 'express';
import Task from '../models/Task.js';
import { TaskDb } from '../config/jsonDb.js';
import { getUseJsonDb } from '../config/db.js';

const router = express.Router();

// Get all tasks for a specific user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    let tasks;
    if (getUseJsonDb()) {
      tasks = await TaskDb.find({ userId });
      // Sort tasks by creation date descending (JSON fallback)
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, estimatedPomodoros, userId } = req.body;
    const taskData = {
      title,
      description: description || '',
      priority: priority || 'medium',
      estimatedPomodoros: Number(estimatedPomodoros) || 1,
      completedPomodoros: 0,
      completed: false,
      userId: userId || 'anonymous'
    };

    let newTask;
    if (getUseJsonDb()) {
      newTask = await TaskDb.create(taskData);
    } else {
      newTask = new Task(taskData);
      await newTask.save();
    }
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a task (e.g. checkbox state or adding a pomodoro completion)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let updatedTask;
    if (getUseJsonDb()) {
      updatedTask = await TaskDb.findByIdAndUpdate(id, req.body);
    } else {
      updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
    }
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let deletedTask;
    if (getUseJsonDb()) {
      deletedTask = await TaskDb.findByIdAndDelete(id);
    } else {
      deletedTask = await Task.findByIdAndDelete(id);
    }
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully', task: deletedTask });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

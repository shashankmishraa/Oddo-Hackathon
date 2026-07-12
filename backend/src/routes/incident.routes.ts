import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Get incidents placeholder', data: [] });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create incident placeholder' });
});

router.put('/:id', (req, res) => {
  res.json({ success: true, message: 'Resolve incident placeholder' });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Delete incident placeholder' });
});

export default router;

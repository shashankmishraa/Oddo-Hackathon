import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Get routes placeholder', data: [] });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Create route placeholder' });
});

router.put('/:id', (req, res) => {
  res.json({ success: true, message: 'Update route placeholder' });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Delete route placeholder' });
});

export default router;

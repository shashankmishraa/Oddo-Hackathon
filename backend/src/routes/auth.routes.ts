import { Router } from 'express';
import { login, register, getMe, logout } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;

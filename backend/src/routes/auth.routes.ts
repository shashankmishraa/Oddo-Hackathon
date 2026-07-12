import { Router } from 'express';
import { login, register, getMe, logout, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);

export default router;

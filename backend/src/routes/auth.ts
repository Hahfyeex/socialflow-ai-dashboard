import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { register, login, refresh, logout } from '../controllers/auth';

const router = Router();

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }
  next();
};

const credentialsRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
];

router.post('/register', credentialsRules, validate, register);
router.post('/login', credentialsRules, validate, login);
router.post('/refresh', body('refreshToken').notEmpty(), validate, refresh);
router.post('/logout', body('refreshToken').notEmpty(), validate, logout);

export default router;

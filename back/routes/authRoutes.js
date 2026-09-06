import {Router} from 'express';
import {login,sendSecrCode,verifyCode,restartCheckAuth,logOut} from '../controllers/authController.js';

const router = Router();

router.post('/login',login);
router.post('/secrcode',sendSecrCode);
router.post('/verify-code',verifyCode);
router.post('/refresh', restartCheckAuth);
router.post('/logout',logOut);

export default router;
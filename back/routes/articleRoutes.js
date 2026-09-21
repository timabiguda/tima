import {Router} from 'express';
import {createArticle,getArticles,getArticleById} from '../controllers/articleController.js';
import {verifyToken} from '../middlewares/authMiddleware.js';

const router=Router();

router.post('/articles',verifyToken,createArticle);

router.get('/articles',getArticles);
router.get('/articles/:id',getArticleById);

export default router;
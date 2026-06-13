import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
dotenv.config();

import goalsRouter from './routes/goals.js';
import sleepRouter from './routes/sleep.js';
import tasksRouter from './routes/tasks.js';
import pmoRouter from './routes/pmo.js';
import exerciseRouter from './routes/exercise.js';
import statsRouter from './routes/stats.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', server: 'DisciplineOS', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DisciplineOS API Docs',
  customJsStr: '(function(){var o=new MutationObserver(function(){document.documentElement.classList.remove("dark-mode")});o.observe(document.documentElement,{attributes:!0,attributeFilter:["class"]});document.documentElement.classList.remove("dark-mode")})()',
}));

app.use('/api/goals', goalsRouter);
app.use('/api/sleep', sleepRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/pmo', pmoRouter);
app.use('/api/exercise', exerciseRouter);
app.use('/api/stats', statsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`DisciplineOS server running on port ${PORT}`);
});

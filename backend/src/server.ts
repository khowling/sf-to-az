import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import accountRoutes from './routes/accounts.js';
import contactRoutes from './routes/contacts.js';
import opportunityRoutes from './routes/opportunities.js';
import fieldDefinitionRoutes from './routes/fieldDefinitions.js';
import pageLayoutRoutes from './routes/pageLayouts.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/accounts', accountRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/field-definitions', fieldDefinitionRoutes);
app.use('/api/page-layouts', pageLayoutRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

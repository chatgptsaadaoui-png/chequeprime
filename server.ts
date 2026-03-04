import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/clients', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await supabase.from('clients').select('*').eq('user_id', userId).order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.post('/api/clients', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id, name, phone, email } = req.body;
    const { data, error } = await supabase.from('clients').insert([{ id, name, phone, email, user_id: userId }]).select();
    if (error) {
      console.error('Supabase error (clients):', error);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data?.[0] || req.body);
  });

  app.put('/api/clients/:id', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { name, phone, email } = req.body;
    const { data, error } = await supabase.from('clients').update({ name, phone, email }).eq('id', id).eq('user_id', userId).select();
    if (error) {
      console.error('Supabase error (update client):', error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data?.[0] || req.body);
  });

  app.delete('/api/clients/:id', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { error } = await supabase.from('clients').delete().eq('id', id).eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  });

  app.get('/api/suppliers', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await supabase.from('suppliers').select('*').eq('user_id', userId).order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.post('/api/suppliers', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id, name, phone, email } = req.body;
    const { data, error } = await supabase.from('suppliers').insert([{ id, name, phone, email, user_id: userId }]).select();
    if (error) {
      console.error('Supabase error (suppliers):', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data?.[0] || req.body);
  });

  app.put('/api/suppliers/:id', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { name, phone, email } = req.body;
    const { data, error } = await supabase.from('suppliers').update({ name, phone, email }).eq('id', id).eq('user_id', userId).select();
    if (error) {
      console.error('Supabase error (update supplier):', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }
    res.json(data?.[0] || req.body);
  });

  app.delete('/api/suppliers/:id', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { error } = await supabase.from('suppliers').delete().eq('id', id).eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  });

  app.get('/api/checks', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { data, error } = await supabase.from('checks').select('*').eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    
    // Sort in-memory to avoid "column not found" errors in the database query
    const sortedData = (data || []).sort((a: any, b: any) => {
      const dateA = new Date(a.dueDate || a.duedate || 0).getTime();
      const dateB = new Date(b.dueDate || b.duedate || 0).getTime();
      return dateB - dateA;
    });
    
    res.json(sortedData);
  });

  app.post('/api/checks', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id, number, dueDate, paymentDate, beneficiary, bank, cause, amount, type, status } = req.body;
    // Send both camelCase and lowercase to ensure compatibility with any Postgres schema
    const { data, error } = await supabase.from('checks').insert([{ 
      id, 
      number, 
      dueDate,
      duedate: dueDate, 
      paymentDate,
      paymentdate: paymentDate, 
      beneficiary, 
      bank, 
      cause, 
      amount, 
      type, 
      status,
      user_id: userId
    }]).select();
    
    if (error) {
      console.error('Supabase error (checks):', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data?.[0] || req.body);
  });

  app.put('/api/checks/:id', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { number, dueDate, paymentDate, beneficiary, bank, cause, amount, type, status } = req.body;
    const { data, error } = await supabase.from('checks').update({ 
      number, 
      dueDate,
      duedate: dueDate, 
      paymentDate,
      paymentdate: paymentDate, 
      beneficiary, 
      bank, 
      cause, 
      amount, 
      type, 
      status 
    }).eq('id', id).eq('user_id', userId).select();
    
    if (error) {
      console.error('Supabase error (update check):', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message });
    }
    res.json(data?.[0] || req.body);
  });

  app.delete('/api/checks/:id', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { error } = await supabase.from('checks').delete().eq('id', id).eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  });

  app.get('/api/stats/chart', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { data: checks, error } = await supabase.from('checks').select('*').eq('user_id', userId);
    if (error) return res.status(500).json({ error: error.message });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      
      const monthChecks = (checks || []).filter(c => {
        const dateStr = c.dueDate || c.duedate;
        if (!dateStr) return false;
        const checkDate = new Date(dateStr);
        return checkDate.getMonth() === monthIndex && checkDate.getFullYear() === year;
      });
      
      result.push({
        name: months[monthIndex],
        client: monthChecks.filter(c => c.type === 'client').reduce((acc, c) => acc + c.amount, 0),
        supplier: monthChecks.filter(c => c.type === 'supplier').reduce((acc, c) => acc + c.amount, 0)
      });
    }

    res.json(result);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

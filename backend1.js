const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const QRCode = require('qrcode'); 
const app = express();
const port = 3000;


// PostgreSQL connection setup
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database:'postgres',
  password: '2004',
  port: 5432,
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database successfully!');
  })
  .catch((error) => {
    console.error('Failed to connect to PostgreSQL database:', error.stack);
    process.exit(1); // Exit the process if connection fails
  });
// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Enable JSON parsing

app.get('/api/report/filters', async (req, res) => {
    try {
      const authors = await pool.query('SELECT DISTINCT author FROM books');
      const bookNames = await pool.query('SELECT DISTINCT book_name FROM books');
      const genres = await pool.query('SELECT DISTINCT genre FROM books');
      const boughtFromSources = await pool.query('SELECT DISTINCT bought_from FROM books');
      const bookTypes = await pool.query('SELECT DISTINCT book_type FROM books');
  
      res.json({
        authors: authors.rows.map(row => row.author),
        bookNames: bookNames.rows.map(row => row.book_name),
        genres: genres.rows.map(row => row.genre),
        boughtFromSources: boughtFromSources.rows.map(row => row.bought_from),
        bookTypes: bookTypes.rows.map(row => row.book_type)
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  });
  
  // Get book report based on filters
  app.post('/api/report/book-report', async (req, res) => {
    const { author, bookName, genre, boughtFrom, bookType } = req.body;
    
    try {
      const query = `
        SELECT * FROM books 
        WHERE ($1::text IS NULL OR author = $1) 
          AND ($2::text IS NULL OR book_name = $2) 
          AND ($3::text IS NULL OR genre = $3) 
          AND ($4::text IS NULL OR bought_from = $4) 
          AND ($5::text IS NULL OR book_type = $5)
      `;
      
      const result = await pool.query(query, [author, bookName, genre, boughtFrom, bookType]);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  });
  
  app.get('/unique-author', async (req, res) => {
    try {
      const result = await client.query('SELECT DISTINCT author FROM book');
      const authors = result.rows.map(row => row.author);
      res.json(authors);
    } catch (error) {
      console.error('Error fetching unique authors:', error.stack);
      res.status(500).json({ error: 'Failed to fetch unique authors' });
    }
  });
  
  app.get('/unique-bookName', async (req, res) => {
    try {
      const result = await client.query('SELECT DISTINCT book_name FROM book');
      const bookNames = result.rows.map(row => row.book_name);
      res.json(bookNames);
    } catch (error) {
      console.error('Error fetching unique authors:', error.stack);
      res.status(500).json({ error: 'Failed to fetch unique authors' });
    }
  });

  app.get('/unique-genre', async (req, res) => {
    try {
      const result = await client.query('SELECT DISTINCT genre FROM book');
      const genres = result.rows.map(row => row.genre);
      res.json(genres);
    } catch (error) {
      console.error('Error fetching unique authors:', error.stack);
      res.status(500).json({ error: 'Failed to fetch unique authors' });
    }
  });
  
  app.get('/unique-boughtFrom', async (req, res) => {
    try {
      const result = await client.query('SELECT DISTINCT bought_from FROM book');
      const boughtFromSources = result.rows.map(row => row.bought_from);
      res.json(boughtFromSources);
    } catch (error) {
      console.error('Error fetching unique authors:', error.stack);
      res.status(500).json({ error: 'Failed to fetch unique authors' });
    }
  });

  app.get('/unique-bookType', async (req, res) => {
    try {
      const result = await client.query('SELECT DISTINCT book_type FROM book');
      const bookTypes = result.rows.map(row => row.book_type);
      res.json(bookTypes);
    } catch (error) {
      console.error('Error fetching unique book type:', error.stack);
      res.status(500).json({ error: 'Failed to fetch unique booktypes' });
    }
  });
  
  app.get('/book-reportz', async (req, res) => {
    const { author, bookName, genre,boughtFrom, bookType } = req.query;
    console.log('Received query parameters:', req.query); // Log query params to ensure they're coming correctly
    try {
      const query = `
        SELECT * FROM book_detail3($1, $2, $3, $4, $5);
      `;
      const result = await client.query(query, [author || null, bookName || null,genre || null, boughtFrom || null, bookType || null]);
      console.log('Query result:', result.rows); // Log the result from the query
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching book report:', error);  // Log the error for debugging
      res.status(500).json({ error: 'Failed to fetch book report' });
    }
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
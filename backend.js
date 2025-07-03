//curl -X GET http://localhost:3000/books
require('dotenv').config();
const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const QRCode = require('qrcode'); 
const app = express();
const port = process.env.PORT ||3000;
const PDFDocument = require('pdfkit');
const dns = require('dns');
const net = require('net');
console.log('DATABASE_URL:', process.env.DatabaseLib);

dns.lookup('db.fyczwcdyzxtdbkpfyzzn.supabase.co', { family: 4 }, (err, address) => {
  if (err) {
    console.error('DNS lookup failed:', err);
    return;
  }
  console.log('IPv4 address resolved:', address);
  const client = new Client({
    host: address,
    port: 5432,
    user: 'postgres',
    password: 'Rishabh#1729', // or use process.env
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
 client.connect()
    .then(() => {
      console.log('Connected to PostgreSQL database successfully!');
      // ✅ Run query INSIDE this .then()
      return client.query('SELECT NOW()');
    })
    .then(result => {
      console.log('Current time in DB:', result.rows[0].now);
    })
    .catch(error => {
      console.error('Failed to connect to PostgreSQL database:', error.stack);
      process.exit(1);
    });
  module.exports = client;
});


client.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection failed', err);
  } else {
    console.log('Connected successfully at', res.rows[0].now);
  }
});


app.use(cors()); 
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Server is running');
});
app.get('/books', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM book ');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving books');
  }
});
app.get('/bookscount', async (req, res) => {
  try {
    const result = await client.query('SELECT *, COUNT(*) OVER() AS total_count FROM book');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving books');
  }
});


app.get('/location-all', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM book inner join location on book.location_id=location.location_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving books');
  }
});

app.get('/transaction-all', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM transaction');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving books');
  }
});

app.get('/books/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await client.query('SELECT * FROM book WHERE book_name = $1', [name]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Book not found');
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving book');
  }
});

app.delete('/books/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await client.query('DELETE FROM book WHERE book_id = $1', [id]);
    if (result.rowCount > 0) {
      res.json({ message: 'Book deleted successfully' });
    } else {
      res.status(404).send('Book not found');
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error deleting book');
  }
});

app.delete('/deletecust/:id', async (req, res) => {
  try {
    const identity = req.params.id;
    const result = await client.query('DELETE FROM customer WHERE cust_id = $1', [identity]);
    if (result.rowCount > 0) {
      res.json({ message: 'Customer deleted successfully' });
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error deleting Customer');
  }
});


app.get('/authors', async (req, res) => {
  try {
    const result = await client.query('SELECT DISTINCT author FROM book');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving Authors');
  }
});

app.get('/authors/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await client.query('SELECT * FROM book WHERE author = $1', [name]);
    if (result.rows.length > 0) {
      res.json(result.rows);
    } 
    else
     {
      res.status(404).send('Book not found');
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving book');
  }
});



app.get('/customers', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM customer');
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving books');
  }
});

app.get('/customers/:id', async (req, res) => {
  try {
    const  identity  = parseInt(req.params.id);
    const result = await client.query('SELECT * FROM customer WHERE cust_id = $1 ', [identity]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Customer not found');
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving book');
  }
});

app.get('/lent', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM book WHERE indicator = $1', ['red']);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving Authors');
  }
});
app.put('/return/:id', async (req, res) => {
  const bookId = req.params.id;
  const currentDate = new Date();
  const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    const result = await client.query(
      'UPDATE book SET indicator = $1, current_status = $2, return_date = $3 WHERE book_id = $4',
      ['green', 'Available',formattedCurrentDate, bookId]
    );
    res.status(200).send('Book returned successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});



app.get('/return', async (req, res) => {
  try {
    
    const result = await client.query('SELECT * FROM book WHERE indicator = $1 and last_borrower != $2 ', ['green','No Last Borrower']);
    res.json(result.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving Authors');
  }
});

app.get('/test', (req, res) => {
  res.send('Test endpoint is working');
});

// app.post('/postbooks', (req, res) => {
//   const { bookName, author, price, purchaseDate, boughtFrom, bookType, identity } = req.body;

//   client.query(
//     'INSERT INTO book (book_name, author, price, date_of_purchase, bought_from, current_status, book_type, id,indicator) VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9) RETURNING *',
//     [bookName, author, price, purchaseDate, boughtFrom, "Available" , bookType, identity,"green"],
//     (error, results) => {
//       if (error) {
//         console.error('Error executing query', error.stack);
//         return res.status(500).json({ error: 'An error occurred while adding the book' });
//       }
//       res.status(201).json({ message: 'Book added successfully', book: results.rows[0] });
//     }
//   );
// });


app.post('/books', async (req, res) => {
  const { bookName, author, price, purchaseDate, boughtFrom, bookType, identity } = req.body;

  // Generate QR code data
  const qrData = JSON.stringify({
    bookName,
    author,
    price,
    purchaseDate,
    boughtFrom,
    currentStatus: 'Available',
    bookType,
    identity
  });

  // Generate QR code
  QRCode.toDataURL(qrData, async (err, url) => {
    if (err) {
      console.error('Error generating QR code', err);
      return res.status(500).json({ error: 'An error occurred while generating the QR code' });
    }

    try {
      // Insert book details along with the QR code URL into the database
      const result = await client.query(
        'INSERT INTO book (book_name, author, price, date_of_purchase, bought_from, current_status, book_type, book_id, indicator, qrcode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [bookName, author, price, purchaseDate, boughtFrom, 'Available', bookType, identity, 'green', url]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation error code for PostgreSQL
        res.status(400).send({ error: 'ID already used' });
      } else {
        console.error('Error inserting Book:', error); // Log the error for debugging
        res.status(500).send({ error: 'Internal Server Error' });
      }
    }
  });
});
app.post('/postcust', async (req, res) => {
  const { Fname, Lname, Mobile, Email, Address, Id,Date } = req.body;

  try {
      // Assuming you're using a PostgreSQL client like pg
      await client.query('INSERT INTO public.customer (cust_fname, cust_lname, mobile, email, address, cust_id,join_date) VALUES ($1, $2, $3, $4, $5, $6,$7)', 
      [Fname, Lname, Mobile, Email, Address, Id,Date]);

      res.status(201).send({ message: 'Customer added successfully' });

  } catch (error) {
 
      if (error.code === '23505') { // Unique violation error code for PostgreSQL
          res.status(400).send({ error: 'ID already used' });
      } else {
        console.error('Error inserting customer:', error); // Log the error for debugging
        res.status(500).send({ error: 'Internal Server Error' })          
      }
  }
});

app.put('/booksUpdateColor/:id/:cust/:custid', async (req, res) => {
  try {
    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const futureDate = new Date(currentDate);
    futureDate.setDate(currentDate.getDate() + 14);
    const formattedFutureDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    const bookId = parseInt(req.params.id, 10);
    const custName = req.params.cust;
    const custId = parseInt(req.params.custid, 10);
    // const copyId = parseInt(req.params.copyid, 10);

    if (isNaN(bookId) || isNaN(custId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    // Start a database transaction
    await client.query('BEGIN');

    // 1️⃣ Update the book table: Set indicator to red & update current status
    const bookUpdateQuery = `
      UPDATE book 
      SET indicator = $1, last_borrower = $2, current_status = $3 
      WHERE book_id = $4
      RETURNING book_id;
    `;

    const bookUpdateResult = await client.query(bookUpdateQuery, [
      "red", custName, "Lent", bookId
    ]);

    if (bookUpdateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Book with ID ${bookId} not found` });
    }

    // 2️⃣ Insert into transaction table & get the generated transaction_id
    const transactionQuery = `
      INSERT INTO transaction (transaction_id,cust_id, book_id, lending_date, return_date, due_amount, paid_amount, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING transaction_id;
    `;

    const transactionResult = await client.query(transactionQuery, [
      custId, bookId, formattedCurrentDate, formattedFutureDate, 0, 0, "Lent"
    ]);

    const transactionId = transactionResult.rows[0].transaction_id;

    // 3️⃣ Insert into lending table using the newly generated transaction_id
    const lendingQuery = `
      INSERT INTO lending (transaction_id, cust_id, book_id, due_date, return_status) 
      VALUES ($1, $2, $3, $4, $5);
    `;

    await client.query(lendingQuery, [
      transactionId, custId, bookId, formattedFutureDate, "Not Returned"
    ]);

    // Commit the transaction
    await client.query('COMMIT');

    return res.status(200).json({ 
      message: `Book with ID ${bookId} updated successfully, and transaction & lending records created.` 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error updating book, transaction, and lending records: ${error.message}`);
    return res.status(500).json({ error: `Error updating records: ${error.message}` });
  }
});

app.put('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { bookName, author, price, purchaseDate, boughtFrom, bookType, identity } = req.body;

  client.query(
    'UPDATE book SET book_name = $1, author = $2, price = $3, date_of_purchase = $4, bought_from = $5, book_type = $6, book_id = $7 WHERE book_id = $8 RETURNING *',
    [bookName, author, price, purchaseDate, boughtFrom, bookType, identity, id],
    (error, results) => {
      if (error) {
        res.status(500).send(`Error updating book with ID ${id}: ${error.message}`);
      } else {
        res.status(200).json(results.rows[0]);      }
    }
  );
});

app.put('/cust/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { Fname, Lname, Mobile, Email, Address, Id } = req.body;

  client.query(
    'UPDATE customer SET cust_fname = $1, cust_lname = $2, mobile = $3, email = $4, address = $5 WHERE cust_id = $6 RETURNING *',
    [Fname, Lname, Mobile, Email, Address, id],
    (error, results) => {
      if (error) {
        res.status(500).send(`Error updating customer with ID ${id}: ${error.message}`);
      } else {
        res.status(200).json(results.rows[0]);
      }
    }
  );
});


app.get('/custName/:custId', async (req, res) => {
  try {
    const identity = parseInt(req.params.custId);
    console.log(identity);
    const result = await client.query('SELECT * FROM transaction WHERE cust_id = $1', [identity]);
   
    if (result.rows.length == 0) {
      
      res.json(null);
      
    }
    else{
      res.json(result.rows); // Sending all rows as an array
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error retrieving books');
  }
});
// Endpoint to fetch book by ID
app.get('/books/:id', async (req, res) => {
  const { identity } = parseInt(req.params.id);
  console.log(identity);

  try {
    const result = await client.query('SELECT * FROM book WHERE book_id = $1', [identity]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    console.error('Error fetching book by ID:', error);
    res.status(500).json({ error: 'An error occurred while fetching the book' });
  }
});



app.get('/books/:id/qrcode', async (req, res) => {
  const bookId = req.params.id;
  
  // You would typically fetch book details by ID here.
  // For simplicity, we use a static URL.
  const qrData = `http://localhost:3000/books/${bookId}`;
  
  try {
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    res.send(qrCodeUrl);
  } catch (err) {
    console.error('Error generating QR code', err);
    res.status(500).send('Error generating QR code');
  }
});







app.get('/book-report', async (req, res) => {
  const { author, bookName, boughtFrom, bookType } = req.query;
  console.log('Received query parameters:', req.query); // Log query params to ensure they're coming correctly
  try {
    const query = `
      SELECT * FROM book_detail4($1, $2, $3, $4);
    `;
    const result = await client.query(query, [author || null, bookName || null, boughtFrom || null, bookType || null]);
    console.log('Query result:', result.rows); // Log the result from the query
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching book report:', error);  // Log the error for debugging
    res.status(500).json({ error: 'Failed to fetch book report' });
  }
});



app.get('/location-report', async (req, res) => {
  const {bookName, shelfType } = req.query;
  console.log('Received query parameters:', req.query); // Log query params to ensure they're coming correctly
  try {
    const query = `
      SELECT * FROM locationz($1, $2);
    `;
    const result = await client.query(query, [bookName || null, shelfType || null]);
    console.log('Query result:', result.rows); // Log the result from the query
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching book report:', error);  // Log the error for debugging
    res.status(500).json({ error: 'Failed to fetch book report' });
  }
});


app.get('/trans-report', async (req, res) => {
  const {tranId } = req.query;
  console.log('Received query parameters:', req.query); 
  try {
    const query = `
      SELECT * FROM lend($1) order by transaction_id;
    `;
    const result = await client.query(query, [tranId || null]);
    const formattedResult = result.rows.map(row => ({
      ...row,
      lending_date: row.lending_date ? row.lending_date.toISOString().split('T')[0] : null,
      due_date: row.due_date ? row.due_date.toISOString().split('T')[0] : null,
      return_date: row.return_date ? row.return_date.toISOString().split('T')[0] : null
    }));

    console.log('Query result:', formattedResult); 
    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching book report:', error); 
    res.status(500).json({ error: 'Failed to fetch book report' });
  }
});

app.get('/filter-books', async (req, res) => {
  try {
    let query = 'SELECT DISTINCT author, book_name, bought_from, book_type FROM book WHERE 1=1';
    const params = [];
    
    if (req.query.author) {
      query += ' AND author = $' + (params.length + 1);
      params.push(req.query.author);
    }
    if (req.query.bookName) {
      query += ' AND book_name = $' + (params.length + 1);
      params.push(req.query.bookName);
    }
    if (req.query.boughtFrom) {
      query += ' AND bought_from = $' + (params.length + 1);
      params.push(req.query.boughtFrom);
    }
    if (req.query.bookType) {
      query += ' AND book_type = $' + (params.length + 1);
      params.push(req.query.bookType);
    }

    const result = await client.query(query, params);
    
    const filteredData = {
      authors: [...new Set(result.rows.map(row => row.author))],
      bookNames: [...new Set(result.rows.map(row => row.book_name))],
      boughtFromSources: [...new Set(result.rows.map(row => row.bought_from))],
      bookTypes: [...new Set(result.rows.map(row => row.book_type))]
    };

    res.json(filteredData);
  } catch (error) {
    console.error('Error fetching filtered books:', error.stack);
    res.status(500).json({ error: 'Failed to fetch filtered books' });
  }
});

app.get('/filter-locations', async (req, res) => {
  try {
    let query = 'SELECT DISTINCT b.book_name, l.shelf_type FROM location l inner join book b on l.location_id=b.location_id WHERE 1=1';
    const params = [];
    
   
    if (req.query.bookName) {
      query += ' AND book_name = $' + (params.length + 1);
      params.push(req.query.bookName);
    }
    
    if (req.query.shelfType) {
      query += ' AND shelf_type = $' + (params.length + 1);
      params.push(req.query.shelfType);
    }

    const result = await client.query(query, params);
    
    const filteredData = {
      bookNames: [...new Set(result.rows.map(row => row.book_name))],
      shelfTypes: [...new Set(result.rows.map(row => row.shelf_type))]
    };

    res.json(filteredData);
  } catch (error) {
    console.error('Error fetching filtered books:', error.stack);
    res.status(500).json({ error: 'Failed to fetch filtered books' });
  }
});



app.get('/unique-author', async (req, res) => {
  try {
    const result = await client.query('SELECT DISTINCT author FROM book order by author asc');
    const authors = result.rows.map(row => row.author);
    res.json(authors);
  } catch (error) {
    console.error('Error fetching unique authors:', error.stack);
    res.status(500).json({ error: 'Failed to fetch unique authors' });
  }
});

app.get('/unique-bookName', async (req, res) => {
  try {
    const result = await client.query('SELECT DISTINCT book_name FROM book order by book_name asc');
    const bookNames = result.rows.map(row => row.book_name);
    res.json(bookNames);
  } catch (error) {
    console.error('Error fetching unique authors:', error.stack);
    res.status(500).json({ error: 'Failed to fetch unique authors' });
  }
});

app.get('/unique-boughtFrom', async (req, res) => {
  try {
    const result = await client.query('SELECT DISTINCT bought_from FROM book order by bought_from asc');
    const boughtFromSources = result.rows.map(row => row.bought_from);
    res.json(boughtFromSources);
  } catch (error) {
    console.error('Error fetching unique authors:', error.stack);
    res.status(500).json({ error: 'Failed to fetch unique authors' });
  }
});

app.get('/unique-bookType', async (req, res) => {
  try {
    const result = await client.query('SELECT DISTINCT book_type FROM book order by book_type asc');
    const bookTypes = result.rows.map(row => row.book_type);
    res.json(bookTypes);
  } catch (error) {
    console.error('Error fetching unique authors:', error.stack);
    res.status(500).json({ error: 'Failed to fetch unique authors' });
  }
});

app.get('/unique-shelfType', async (req, res) => {
  try {
    const result = await client.query('SELECT DISTINCT shelf_type FROM location order by shelf_type asc');
    const shelfTypes = result.rows.map(row => row.shelf_type);
    res.json(shelfTypes);
  } catch (error) {
    console.error('Error fetching unique authors:', error.stack);
    res.status(500).json({ error: 'Failed to fetch unique authors' });
  }
});

app.get('/unique-tranId', async (req, res) => {
  try {
    const result = await client.query('SELECT DISTINCT transaction_id FROM transaction order by transaction_id');
    const transIds = result.rows.map(row => row.transaction_id);
    res.json(transIds);
  } catch (error) {
    console.error('Error fetching unique authors:', error.stack);
    res.status(500).json({ error: 'Failed to fetch unique authors' });
  }
});



app.get('/generate-pdf', (req, res) => {
  // Retrieve and parse the bookReport from the query parameter
  const bookReport = JSON.parse(req.query.bookReport); // Parse the JSON string sent from frontend

  const doc = new PDFDocument();

  // Set PDF headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=book_report.pdf');

  // Pipe PDF to response (download it)
  doc.pipe(res);

  // Add title and content to the PDF
  doc.fontSize(18).text('Book Report', { align: 'center' });
  doc.moveDown();

  // Table column headers
  const columns = ['Book ID', 'Book Name', 'Book Type', 'Author', 'Price'];
  const cellPadding = 5;  // Padding for text inside cells
  const tableTop = doc.y + 10;  // Starting position of the table

  // Set the column widths
  const columnWidths = [50, 150, 100, 100, 50];
  const tableWidth = columnWidths.reduce((acc, width) => acc + width, 0);

  // Header background color
  const headerColor = '#D3D3D3';

  // Draw table headers with borders and highlight
  columns.forEach((column, index) => {
    const x = 50 + columnWidths.slice(0, index).reduce((acc, width) => acc + width, 0);
    
    // Fill header cells with background color
    doc.rect(x, tableTop, columnWidths[index], 20).fillColor(headerColor).fill();
    
    // Draw border for each header cell
    doc.rect(x, tableTop, columnWidths[index], 20).stroke();
    
    // Add header text with adjusted padding for better alignment
    doc.fillColor('black').text(column, x + cellPadding, tableTop + 5, { width: columnWidths[index] - cellPadding * 2, align: 'center' });
  });

  // Draw horizontal border after the header row
  doc.moveTo(50, tableTop + 20).lineTo(50 + tableWidth, tableTop + 20).stroke();

  // Loop through the bookReport and add details to the PDF as rows in the table
  bookReport.forEach((book, rowIndex) => {
    const y = tableTop + 25 + rowIndex * 25; // Calculate the Y position for each row

    columns.forEach((column, colIndex) => {
      const x = 50 + columnWidths.slice(0, colIndex).reduce((acc, width) => acc + width, 0);
      const cellText = column === 'Price' ? `$${book[column.toLowerCase()]}` : book[column.toLowerCase()];

      // Draw borders for each cell
      doc.rect(x, y, columnWidths[colIndex], 20).stroke();
      
      // Add text inside each cell with proper padding and alignment
      doc.text(cellText, x + cellPadding, y + 5, { width: columnWidths[colIndex] - cellPadding * 2, align: 'center' });
    });

    // Draw horizontal border after each row
    doc.moveTo(50, y + 20).lineTo(50 + tableWidth, y + 20).stroke();
  });

  // Finalize the PDF and send
  doc.end();
});
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
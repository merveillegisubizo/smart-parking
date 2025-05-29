const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'smartpark-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartpark_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database');

  // Create database if it doesn't exist
  db.query('CREATE DATABASE IF NOT EXISTS smartpark_db', (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }

    // Use the database
    db.query('USE smartpark_db', (err) => {
      if (err) {
        console.error('Error using database:', err);
        return;
      }

      // Create tables
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      const createParkingSlotTable = `
        CREATE TABLE IF NOT EXISTS parkingslot (
          slotNumber INT PRIMARY KEY,
          slotStatus ENUM('available', 'occupied') DEFAULT 'available'
        )
      `;

      const createCarTable = `
        CREATE TABLE IF NOT EXISTS car (
          plateNumber VARCHAR(20) PRIMARY KEY,
          driverName VARCHAR(100) NOT NULL,
          phoneNumber VARCHAR(20) NOT NULL
        )
      `;

      const createParkingRecordTable = `
        CREATE TABLE IF NOT EXISTS parkingrecord (
          id INT AUTO_INCREMENT PRIMARY KEY,
          plateNumber VARCHAR(20) NOT NULL,
          slotNumber INT NOT NULL,
          entryTime DATETIME DEFAULT CURRENT_TIMESTAMP,
          exitTime DATETIME NULL,
          duration INT NULL,
          FOREIGN KEY (plateNumber) REFERENCES car(plateNumber),
          FOREIGN KEY (slotNumber) REFERENCES parkingslot(slotNumber)
        )
      `;

      const createPaymentTable = `
        CREATE TABLE IF NOT EXISTS payment (
          id INT AUTO_INCREMENT PRIMARY KEY,
          parkingRecordId INT NOT NULL,
          amountPaid DECIMAL(10, 2) NOT NULL,
          paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
          userId INT NOT NULL,
          FOREIGN KEY (parkingRecordId) REFERENCES parkingrecord(id),
          FOREIGN KEY (userId) REFERENCES users(id)
        )
      `;

      // Execute table creation queries
      db.query(createUsersTable, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('Users table created or already exists');
      });

      db.query(createParkingSlotTable, (err) => {
        if (err) console.error('Error creating parking slot table:', err);
        else console.log('Parking slot table created or already exists');
      });

      db.query(createCarTable, (err) => {
        if (err) console.error('Error creating car table:', err);
        else console.log('Car table created or already exists');
      });

      db.query(createParkingRecordTable, (err) => {
        if (err) console.error('Error creating parking record table:', err);
        else console.log('Parking record table created or already exists');
      });

      db.query(createPaymentTable, (err) => {
        if (err) console.error('Error creating payment table:', err);
        else console.log('Payment table created or already exists');
      });

      // Insert some initial parking slots if none exist
      db.query('SELECT COUNT(*) as count FROM parkingslot', (err, results) => {
        if (err) {
          console.error('Error checking parking slots:', err);
          return;
        }

        if (results[0].count === 0) {
          // Insert 20 parking slots
          const values = Array.from({ length: 20 }, (_, i) => [i + 1, 'available']);
          db.query('INSERT INTO parkingslot (slotNumber, slotStatus) VALUES ?', [values], (err) => {
            if (err) console.error('Error inserting initial parking slots:', err);
            else console.log('Initial parking slots created');
          });
        }
      });
    });
  });
});

// Authentication Routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if username already exists
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
      if (err) {
        console.error('Error checking username:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      db.query(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
        (err) => {
          if (err) {
            console.error('Error registering user:', err);
            return res.status(500).json({ message: 'Server error' });
          }

          res.status(201).json({ message: 'User registered successfully' });
        }
      );
    });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = results[0];

    try {
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }

      // Set user session
      req.session.user = {
        id: user.id,
        username: user.username
      };

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      console.error('Error comparing passwords:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
});

app.get('/api/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.json({ user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json({ message: 'Logged out successfully' });
  });
});

// Parking Slot Routes
app.get('/api/parking-slots', (req, res) => {
  db.query('SELECT * FROM parkingslot ORDER BY slotNumber', (err, results) => {
    if (err) {
      console.error('Error fetching parking slots:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(results);
  });
});

app.post('/api/parking-slots', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { slotNumber, slotStatus } = req.body;

  if (!slotNumber) {
    return res.status(400).json({ message: 'Slot number is required' });
  }

  // Check if slot already exists
  db.query('SELECT * FROM parkingslot WHERE slotNumber = ?', [slotNumber], (err, results) => {
    if (err) {
      console.error('Error checking parking slot:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Parking slot already exists' });
    }

    // Insert new slot
    db.query(
      'INSERT INTO parkingslot (slotNumber, slotStatus) VALUES (?, ?)',
      [slotNumber, slotStatus || 'available'],
      (err) => {
        if (err) {
          console.error('Error adding parking slot:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        res.status(201).json({ message: 'Parking slot added successfully' });
      }
    );
  });
});

app.put('/api/parking-slots/:slotNumber', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { slotNumber } = req.params;
  const { slotStatus } = req.body;

  db.query(
    'UPDATE parkingslot SET slotStatus = ? WHERE slotNumber = ?',
    [slotStatus, slotNumber],
    (err) => {
      if (err) {
        console.error('Error updating parking slot:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      res.json({ message: 'Parking slot updated successfully' });
    }
  );
});

app.delete('/api/parking-slots/:slotNumber', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { slotNumber } = req.params;

  // Check if slot is occupied
  db.query('SELECT * FROM parkingslot WHERE slotNumber = ?', [slotNumber], (err, results) => {
    if (err) {
      console.error('Error checking parking slot:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Parking slot not found' });
    }

    if (results[0].slotStatus === 'occupied') {
      return res.status(400).json({ message: 'Cannot delete an occupied parking slot' });
    }

    // Check if slot is referenced in any parking records
    db.query('SELECT * FROM parkingrecord WHERE slotNumber = ?', [slotNumber], (err, results) => {
      if (err) {
        console.error('Error checking parking records:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete this parking slot as it has associated parking records'
        });
      }

      // Delete the slot
      db.query('DELETE FROM parkingslot WHERE slotNumber = ?', [slotNumber], (err) => {
        if (err) {
          console.error('Error deleting parking slot:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        res.json({ message: 'Parking slot deleted successfully' });
      });
    });
  });
});

// Car Routes
app.post('/api/cars', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { plateNumber, driverName, phoneNumber } = req.body;

  if (!plateNumber || !driverName || !phoneNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if car already exists
  db.query('SELECT * FROM car WHERE plateNumber = ?', [plateNumber], (err, results) => {
    if (err) {
      console.error('Error checking car:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
      // Car exists, update information
      db.query(
        'UPDATE car SET driverName = ?, phoneNumber = ? WHERE plateNumber = ?',
        [driverName, phoneNumber, plateNumber],
        (err) => {
          if (err) {
            console.error('Error updating car:', err);
            return res.status(500).json({ message: 'Server error' });
          }

          res.json({ message: 'Car information updated successfully' });
        }
      );
    } else {
      // Car doesn't exist, insert new car
      db.query(
        'INSERT INTO car (plateNumber, driverName, phoneNumber) VALUES (?, ?, ?)',
        [plateNumber, driverName, phoneNumber],
        (err) => {
          if (err) {
            console.error('Error adding car:', err);
            return res.status(500).json({ message: 'Server error' });
          }

          res.json({ message: 'Car added successfully' });
        }
      );
    }
  });
});

app.get('/api/cars', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  db.query('SELECT * FROM car ORDER BY plateNumber', (err, results) => {
    if (err) {
      console.error('Error fetching cars:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(results);
  });
});

// Parking Record Routes
app.post('/api/parking-records/entry', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { plateNumber, slotNumber } = req.body;

  if (!plateNumber || !slotNumber) {
    return res.status(400).json({ message: 'Plate number and slot number are required' });
  }

  // Check if car exists
  db.query('SELECT * FROM car WHERE plateNumber = ?', [plateNumber], (err, results) => {
    if (err) {
      console.error('Error checking car:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Car not found. Please register the car first.' });
    }

    // Check if slot is available
    db.query('SELECT * FROM parkingslot WHERE slotNumber = ?', [slotNumber], (err, results) => {
      if (err) {
        console.error('Error checking parking slot:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Parking slot not found' });
      }

      if (results[0].slotStatus === 'occupied') {
        return res.status(400).json({ message: 'Parking slot is already occupied' });
      }

      // Begin transaction
      db.beginTransaction((err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        // Create parking record
        db.query(
          'INSERT INTO parkingrecord (plateNumber, slotNumber) VALUES (?, ?)',
          [plateNumber, slotNumber],
          (err, result) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error creating parking record:', err);
                res.status(500).json({ message: 'Server error' });
              });
            }

            // Update slot status
            db.query(
              'UPDATE parkingslot SET slotStatus = "occupied" WHERE slotNumber = ?',
              [slotNumber],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    console.error('Error updating slot status:', err);
                    res.status(500).json({ message: 'Server error' });
                  });
                }

                // Commit transaction
                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error('Error committing transaction:', err);
                      res.status(500).json({ message: 'Server error' });
                    });
                  }

                  res.json({
                    message: 'Car entry recorded successfully',
                    parkingRecordId: result.insertId
                  });
                });
              }
            );
          }
        );
      });
    });
  });
});

app.post('/api/parking-records/exit', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { parkingRecordId } = req.body;
  const hourlyRate = 500; // Fixed rate of 500 RWF per hour

  if (!parkingRecordId) {
    return res.status(400).json({ message: 'Parking record ID is required' });
  }

  // Get parking record
  db.query(
    'SELECT * FROM parkingrecord WHERE id = ? AND exitTime IS NULL',
    [parkingRecordId],
    (err, results) => {
      if (err) {
        console.error('Error fetching parking record:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Active parking record not found' });
      }

      const parkingRecord = results[0];
      const entryTime = new Date(parkingRecord.entryTime);
      const exitTime = new Date();

      // Calculate duration in hours (rounded up to nearest hour)
      // Any duration under one hour is still charged the full hourly rate
      const durationMs = exitTime - entryTime;
      const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));

      // Calculate amount (500 RWF per hour)
      const amount = durationHours * hourlyRate;

      // Begin transaction
      db.beginTransaction((err) => {
        if (err) {
          console.error('Error starting transaction:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        // Update parking record
        db.query(
          'UPDATE parkingrecord SET exitTime = ?, duration = ? WHERE id = ?',
          [exitTime, durationHours, parkingRecordId],
          (err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error updating parking record:', err);
                res.status(500).json({ message: 'Server error' });
              });
            }

            // Create payment record
            db.query(
              'INSERT INTO payment (parkingRecordId, amountPaid, userId) VALUES (?, ?, ?)',
              [parkingRecordId, amount, req.session.user.id],
              (err, paymentResult) => {
                if (err) {
                  return db.rollback(() => {
                    console.error('Error creating payment record:', err);
                    res.status(500).json({ message: 'Server error' });
                  });
                }

                // Update slot status
                db.query(
                  'UPDATE parkingslot SET slotStatus = "available" WHERE slotNumber = ?',
                  [parkingRecord.slotNumber],
                  (err) => {
                    if (err) {
                      return db.rollback(() => {
                        console.error('Error updating slot status:', err);
                        res.status(500).json({ message: 'Server error' });
                      });
                    }

                    // Commit transaction
                    db.commit((err) => {
                      if (err) {
                        return db.rollback(() => {
                          console.error('Error committing transaction:', err);
                          res.status(500).json({ message: 'Server error' });
                        });
                      }

                      res.json({
                        message: 'Car exit processed successfully',
                        paymentId: paymentResult.insertId,
                        amount,
                        durationHours
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

app.get('/api/parking-records/active', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  db.query(
    `SELECT pr.id, pr.plateNumber, pr.slotNumber, pr.entryTime, c.driverName, c.phoneNumber
     FROM parkingrecord pr
     JOIN car c ON pr.plateNumber = c.plateNumber
     WHERE pr.exitTime IS NULL
     ORDER BY pr.entryTime DESC`,
    (err, results) => {
      if (err) {
        console.error('Error fetching active parking records:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      res.json(results);
    }
  );
});

// Payments Routes
app.get('/api/payments', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { startDate, endDate } = req.query;

  let query = `
    SELECT
      p.id as paymentId,
      p.amountPaid,
      p.paymentDate,
      pr.plateNumber,
      pr.slotNumber,
      pr.entryTime,
      pr.exitTime,
      pr.duration,
      c.driverName,
      c.phoneNumber,
      u.username as receivedBy
    FROM payment p
    JOIN parkingrecord pr ON p.parkingRecordId = pr.id
    JOIN car c ON pr.plateNumber = c.plateNumber
    JOIN users u ON p.userId = u.id
  `;

  const queryParams = [];

  if (startDate && endDate) {
    query += ` WHERE DATE(p.paymentDate) BETWEEN ? AND ?`;
    queryParams.push(startDate, endDate);
  } else if (startDate) {
    query += ` WHERE DATE(p.paymentDate) >= ?`;
    queryParams.push(startDate);
  } else if (endDate) {
    query += ` WHERE DATE(p.paymentDate) <= ?`;
    queryParams.push(endDate);
  }

  query += ` ORDER BY p.paymentDate DESC`;

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching payments:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    res.json(results);
  });
});

// Get a specific payment by ID
app.get('/api/payments/:paymentId', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { paymentId } = req.params;

  db.query(
    `SELECT
      p.id as paymentId,
      p.amountPaid,
      p.paymentDate,
      pr.plateNumber,
      pr.slotNumber,
      pr.entryTime,
      pr.exitTime,
      pr.duration,
      c.driverName,
      c.phoneNumber,
      u.username as receivedBy
     FROM payment p
     JOIN parkingrecord pr ON p.parkingRecordId = pr.id
     JOIN car c ON pr.plateNumber = c.plateNumber
     JOIN users u ON p.userId = u.id
     WHERE p.id = ?`,
    [paymentId],
    (err, results) => {
      if (err) {
        console.error('Error fetching payment:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      res.json(results[0]);
    }
  );
});

// Reports Routes
app.get('/api/reports/daily', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { date } = req.query;
  const reportDate = date || new Date().toISOString().split('T')[0];

  db.query(
    `SELECT
      p.id as paymentId,
      p.amountPaid,
      p.paymentDate,
      pr.plateNumber,
      pr.slotNumber,
      pr.entryTime,
      pr.exitTime,
      pr.duration,
      c.driverName,
      c.phoneNumber,
      u.username as receivedBy
     FROM payment p
     JOIN parkingrecord pr ON p.parkingRecordId = pr.id
     JOIN car c ON pr.plateNumber = c.plateNumber
     JOIN users u ON p.userId = u.id
     WHERE DATE(p.paymentDate) = ?
     ORDER BY p.paymentDate DESC`,
    [reportDate],
    (err, results) => {
      if (err) {
        console.error('Error generating daily report:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      // Calculate total amount
      const totalAmount = results.reduce((sum, record) => sum + parseFloat(record.amountPaid), 0);

      res.json({
        date: reportDate,
        totalAmount,
        records: results
      });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
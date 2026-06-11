const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;

const express = require("express");

const cors = require("cors");
const path = require("path");




const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));


const mysql = require("mysql");


const http = require("http");
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_PASSWORD =", process.env.DB_PASSWORD ? "FOUND" : "MISSING");
console.log("DB_NAME =", process.env.DB_NAME);
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});


db.connect((err) => {
  if (err) {
    console.log("DB error", err);
  } else {
    console.log("MySQL connected");
  }
});




// Test route
app.get("/", (req, res) => {
    res.send("Server is running");
});



app.post("/admin-login", (req, res) => {

  const { email, password } = req.body;

  // 🔥 admin fixed credentials
  if (email === "admin@test.com" && password === "1234") {

    return res.json({
      status: "success",
      role: "admin"
    });

  }

  return res.json({
    status: "fail",
    message: "Invalid credentials"
  });

});


app.post("/login", (req, res) => {

  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email=? AND password=?";

  db.query(sql, [email, password], (err, result) => {

    if (err) {
      console.log("LOGIN ERROR:", err);

      return res.status(500).json({
        status: "error",
        message: err.message
      });
    }

    if (result && result.length > 0) {
      return res.json({
        status: "success",
        user: result[0]
      });
    }

    return res.json({
      status: "fail"
    });

  });

});

  app.post("/add-user", (req, res) => {
    

  const { name, email,password} = req.body;
  console.log("body:",req.body);

  const sql = `
    INSERT INTO users (name, email,password, role)
    VALUES (?, ?, ?, 'user')
  `;

db.query(sql, [name, email,password], (err, result) => {

  if (err) {
    console.log("❌ DB ERROR:", err);
    return res.json({ status: "error", error: err });
  }

  console.log("✅ INSERT SUCCESS:", result);

  res.json({ status: "success" });
});

});
  

  
  




// GET USERS
app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, result) => {
        if (err) return res.json(err);
        res.json(result);
    });
});

app.get("/get-requests", (req, res) => {

    db.query("SELECT * FROM requests", (err, result) => {

        if (err) {
            console.log(err);
            return res.json([]);
        }

        console.log(result); // 🔥 مهم
        res.json(result);

    });

});

app.get("/get-bookings", (req, res) => {

  db.query("SELECT * FROM bookings", (err, result) => {

    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);

  });

});


app.post("/requests", (req, res) => {
    const { user_email, problem, device } = req.body;

    const sql = "INSERT INTO requests (user_email, problem, device) VALUES (?, ?, ?)";

    db.query(sql, [user_email, problem, device], (err) => {
        if (err) return res.json(err);

        res.json({ message: "Request added" });
    });
});

app.post("/ai-booking", (req, res) => {

    const { user_email, technician_name } = req.body;

    const sql = "INSERT INTO bookings (user_email, technician_name, status) VALUES (?, ?, 'Pending')";

    db.query(sql, [user_email, technician_name], (err) => {

        if (err) {
            console.log(err);
            return res.json({ status: "error" });
        }

        res.json({ status: "success" });

    });

});

app.post("/add-technician", (req, res) => {

    const {
        name,
        speciality,
        location,
        price,
        image,
        rating
    } = req.body;

    const sql = `
      INSERT INTO technicians 
      (name, speciality, location, price, image, rating)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [name, speciality, location, price, image, rating],
      (err) => {
        if (err) {
            console.log(err);
            return res.json({ status: "error" });
        }

        res.json({ status: "success" });
    });
});

app.post("/admin-login", (req, res) => {

    const { email, password } = req.body;

    const sql =
      "SELECT * FROM users WHERE email=? AND password=?";

    db.query(sql, [email, password], (err, result) => {

        if (err) {
            return res.json({
                status: "error"
            });
        }

        if (result.length > 0) {

            res.json({
                status: "success",
                user: result[0]
            });

        } else {

            res.json({
                status: "fail",
                message: "Invalid email or password"
            });

        }

    });

});

app.post("/analyze-problem", (req, res) => {

    const { problem } = req.body;

    let suggestion = "General Technician";

    if (problem.toLowerCase().includes("ac")) {
        suggestion = "AC Technician";
    }
    else if (problem.toLowerCase().includes("washing")) {
        suggestion = "Washing Machine Technician";
    }
    else if (problem.toLowerCase().includes("fridge")) {
        suggestion = "Refrigerator Technician";
    }

    res.json({
        suggestion
    });

});


app.get("/technicians", (req, res) => {
    db.query("SELECT * FROM technicians", (err, result) => {
        if (err) {
            console.log(err);
            return res.json([]);
        }
        res.json(result);
    });
});


app.delete("/delete-user/:id", (req, res) => {

    const id = req.params.id;

    const sql = "DELETE FROM users WHERE id = ?";

    db.query(sql, [id], (err) => {
        if (err) {
            console.log(err);
            return res.json({ status: "error" });
        }

        res.json({ status: "success", message: "User deleted" });
    });

});

app.put("/update-user/:id", (req, res) => {

    const id = req.params.id;
    const { name, email } = req.body;

    const sql = "UPDATE users SET name=?, email=? WHERE id=?";

    db.query(sql, [name, email, id], (err) => {
        if (err) {
            console.log(err);
            return res.json({ status: "error" });
        }

        res.json({ status: "success", message: "User updated" });
    });

});

app.put("/update-status", (req, res) => {

    const { id, status } = req.body;

    const sql =
      "UPDATE requests SET status=? WHERE id=?";

    db.query(sql, [status, id], (err) => {

        if (err) {

            console.log(err);

            return res.json({
                status: "error"
            });

        }

        res.json({
            status: "success"
        });

    });

});

app.post("/book-technician", (req, res) => {

  const {
    user_email,
    technician_name,
    booking_date,
    booking_time
  } = req.body;

  const sql = `
    INSERT INTO bookings
    (
      user_email,
      technician_name,
      booking_date,
      booking_time,
      status
    )
    VALUES (?, ?, ?, ?, 'Pending')
  `;

  db.query(
    sql,
    [
      user_email,
      technician_name,
      booking_date,
      booking_time
    ],
    (err) => {

      if (err) {
        console.log(err);

        return res.status(500).json({
          status: "error"
        });
      }

      res.json({
        status: "success"
      });

    }
  );

});
app.post("/bookings", (req, res) => {
  const {
    user_email,
    technician_name,
    booking_date,
    booking_time
  } = req.body;

  const sql = `
    INSERT INTO bookings 
    (user_email, technician_name, status, booking_date, booking_time)
    VALUES (?, ?, 'Pending', ?, ?)
  `;

  db.query(sql, [
    user_email,
    technician_name,
    booking_date,
    booking_time
  ], (err) => {
    if (err) return res.json({ status: "error" });

    return res.json({ status: "success" });
  });
});

app.get("/dashboard-stats", (req, res) => {

    const usersQuery = "SELECT COUNT(*) AS totalUsers FROM users";
    const techQuery = "SELECT COUNT(*) AS totalTech FROM technicians";
    const reqQuery = "SELECT COUNT(*) AS totalRequests FROM requests";
    const bookQuery = "SELECT COUNT(*) AS totalBookings FROM bookings";

    db.query(usersQuery, (err1, users) => {

        db.query(techQuery, (err2, tech) => {

            db.query(reqQuery, (err3, requests) => {

                db.query(bookQuery, (err4, bookings) => {

                    res.json({
                        users: users[0].totalUsers,
                        technicians: tech[0].totalTech,
                        requests: requests[0].totalRequests,
                        bookings: bookings[0].totalBookings
                    });

                });

            });

        });

    });

});

app.get("/count-users", (req, res) => {
    db.query("SELECT COUNT(*) AS total FROM users", (err, result) => {
        res.json(result[0]);
    });
});

app.get("/count-requests", (req, res) => {
    db.query("SELECT COUNT(*) AS total FROM requests", (err, result) => {
        res.json(result[0]);
    });
});

app.get("/count-technicians", (req, res) => {
    db.query("SELECT COUNT(*) AS total FROM technicians", (err, result) => {
        if (err) {
            return res.json({ total: 0 });
        }
        res.json(result[0]);
    });
});

app.get("/count-bookings", (req, res) => {

  db.query("SELECT COUNT(*) AS total FROM bookings", (err, result) => {

    if (err) {
      return res.json({ total: 0 });
    }

    res.json(result[0]);

  });

});

app.delete("/delete-request/:id", (req, res) => {

  const id = req.params.id;

  db.query("DELETE FROM requests WHERE id = ?", [id], (err) => {

    if (err) return res.json(err);

    return res.json({ message: "Deleted" });

  });

});




  

// 🔥 GET REPAIR HISTORY

app.get("/repair-history", (req, res) => {

  const sql =
    "SELECT * FROM repair_history ORDER BY repair_date DESC";

  db.query(sql, (err, result) => {

    if (err) {

      res.json(err);

    } else {

      res.json(result);

    }

  });

});

app.get("/payments", (req, res) => {

    const sql =
      "SELECT * FROM payments";

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.json([]);

        }

        res.json(result);

    });

});



app.post("/payments", (req, res) => {
  const {
    user_email,
    technician_name,
    amount,
    payment_status,
    payment_method
  } = req.body;

  const sql =
    "INSERT INTO payments (user_email, technician_name, amount, payment_status, payment_method, payment_date) VALUES (?,?,?,?,?,NOW())";

  db.query(sql,
    [user_email, technician_name, amount, payment_status, payment_method],
    (err) => {
      if (err) return res.json({ success: false });

      res.json({ success: true });
    }
  );
});



app.post("/reviews", (req, res) => {

  const {
    technician_name,
    rating,
    comment,
    status
  } = req.body;

  const sql = `
    INSERT INTO reviews
    (technician_name, rating, comment, status)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      technician_name,
      rating,
      comment,
      status
    ],
    (err) => {

      if (err) {

        console.log(err);

        return res.json({
          status: "error"
        });

      }

      res.json({
        status: "success"
      });

    }
  );

});
app.get("/reviews", (req, res) => {

  const sql = "SELECT * FROM reviews";

  db.query(sql, (err, result) => {

    if (err) {
      return res.json([]);
    }

    res.json(result);

  });

});


app.delete("/delete-booking/:id", (req, res) => {

  const { id } = req.params;

  db.query(
    "DELETE FROM bookings WHERE id = ?",
    [id],
    (err) => {

      if (err) {
        console.log(err);

        return res.json({
          status: "error"
        });
      }

      res.json({
        status: "success"
      });

    }
  );

});

app.get("/get-bookings", (req, res) => {

  const sql = "SELECT * FROM bookings ORDER BY id DESC";

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);

  });

});

// In your server.js - UPDATE spare parts quantity
app.put('/spare-parts/:id', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  
  const sql = 'UPDATE spare_parts SET quantity = ? WHERE id = ?';
  db.query(sql, [quantity, id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Quantity updated successfully", quantity: quantity });
  });
});
    

app.post("/spare-parts", (req, res) => {

  const {
    name,
    category,
    price,
    quantity,
    compatible_device,
    image
  } = req.body;

  const sql = `
    INSERT INTO spare_parts
    (name, category, price, quantity, compatible_device, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      category,
      price,
      quantity,
      compatible_device,
      image
    ],
    (err) => {

      if (err) {
        console.log(err);
        return res.json({
          status: "error"
        });
      }

      res.json({
        status: "success"
      });

    }
  );

});


// 🔥 GET ALL SPARE PARTS
// In your server.js - GET single spare part
app.get('/spare-parts/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM spare_parts WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
});

// GET all spare parts
app.get('/spare-parts', (req, res) => {
  db.query('SELECT * FROM spare_parts ORDER BY id DESC', (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});


// 🔥 DELETE SPARE PART
app.delete("/spare-parts/:id", (req, res) => {

  const sql =
    "DELETE FROM spare_parts WHERE id=?";

  db.query(sql, [req.params.id], (err) => {

    if (err) {

      console.log(err);

      return res.json({
        status: "error"
      });

    }

    res.json({
      status: "deleted"
    });

  });

});

app.post("/device-tracking", (req, res) => {

  const {

    user_email,
    device_name,
    technician_name,
    problem,
    estimated_finish

  } = req.body;

  const sql = `
    INSERT INTO device_tracking
    (
      user_email,
      device_name,
      technician_name,
      problem,
      estimated_finish
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      user_email,
      device_name,
      technician_name,
      problem,
      estimated_finish
    ],
    (err) => {

      if (err) {
        console.log(err);
        return res.json({
          status: "error"
        });
      }

      res.json({
        status: "success"
      });

    }
  );

});
app.get("/device-tracking", (req, res) => {

  const sql =
    "SELECT * FROM device_tracking ORDER BY id DESC";

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);

  });

});
app.put("/device-tracking/:id", (req, res) => {

  const {
    status,
    progress,
    technician_notes,
    spare_parts
  } = req.body;

  const sql = `
    UPDATE device_tracking
    SET
      status=?,
      progress=?,
      technician_notes=?,
      spare_parts=?
    WHERE id=?
  `;

  db.query(
    sql,
    [
      status,
      progress,
      technician_notes,
      spare_parts,
      req.params.id
    ],
    (err) => {

      if (err) {
        console.log(err);
        return res.json({
          status: "error"
        });
      }

      res.json({
        status: "updated"
      });

    }
  );

});
app.delete("/device-tracking/:id", (req, res) => {

  const sql =
    "DELETE FROM device_tracking WHERE id=?";

  db.query(sql, [req.params.id], (err) => {

    if (err) {
      return res.json({
        status: "error"
      });
    }

    res.json({
      status: "deleted"
    });

  });

});
app.post("/warranties", (req, res) => {

  const {

    user_email,
    device_name,
    technician_name,
    repair_type,
    warranty_type,
    start_date,
    end_date,
    notes

  } = req.body;

  const sql = `
    INSERT INTO warranties
    (
      user_email,
      device_name,
      technician_name,
      repair_type,
      warranty_type,
      start_date,
      end_date,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      user_email,
      device_name,
      technician_name,
      repair_type,
      warranty_type,
      start_date,
      end_date,
      notes
    ],
    (err) => {

      if (err) {
        console.log(err);
        return res.json({
          status: "error"
        });
      }

      res.json({
        status: "success"
      });

    }
  );

});
app.get("/warranties", (req, res) => {

  const sql =
    "SELECT * FROM warranties ORDER BY id DESC";

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.json([]);
    }

    res.json(result);

  });

});
app.delete("/warranties/:id", (req, res) => {

  const sql =
    "DELETE FROM warranties WHERE id=?";

  db.query(sql, [req.params.id], (err) => {

    if (err) {
      return res.json({
        status: "error"
      });
    }

    res.json({
      status: "deleted"
    });

  });

});
// In your server.js
app.post("/invoices", (req, res) => {
  const { user_email, technician_name, service, total_price, status } = req.body;
  
  const sql = `
    INSERT INTO invoices (user_email, technician_name, service, total_price, status, created_at) 
    VALUES (?, ?, ?, ?, ?, NOW())
  `;
  
  db.query(sql, [user_email, technician_name, service, total_price, status || "Unpaid"], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: result.insertId, status: status || "Unpaid" });
  });
});
app.get("/invoices", (req, res) => {

  const sql = "SELECT * FROM invoices ORDER BY id DESC";

  db.query(sql, (err, result) => {

    if (err) return res.json([]);

    res.json(result);

  });

});
app.delete("/invoices/:id", (req, res) => {

  const sql = "DELETE FROM invoices WHERE id=?";

  db.query(sql, [req.params.id], (err) => {

    if (err) return res.json({ status: "error" });

    res.json({ status: "deleted" });

  });

});
app.get("/analytics/users", (req, res) => {

  const sql = "SELECT COUNT(*) AS total FROM users";

  db.query(sql, (err, result) => {

    if (err) return res.json({ total: 0 });

    res.json(result[0]);

  });

});
app.get("/analytics/technicians", (req, res) => {

  const sql = `
    SELECT COUNT(*) AS total
    FROM technicians
  `;

  db.query(sql, (err, result) => {

    if (err) {
      return res.json({ total: 0 });
    }

    res.json(result[0]);

  });

});
app.get("/analytics/requests", (req, res) => {

  const sql = "SELECT COUNT(*) AS total FROM requests";

  db.query(sql, (err, result) => {

    if (err) return res.json({ total: 0 });

    res.json(result[0]);

  });

});
app.get("/analytics/completed", (req, res) => {

  const sql = `
    SELECT COUNT(*) AS total 
    FROM requests 
    WHERE status='Completed'
  `;

  db.query(sql, (err, result) => {

    if (err) return res.json({ total: 0 });

    res.json(result[0]);

  });

});
app.get("/analytics/revenue", (req, res) => {

  const sql = `
    SELECT SUM(amount) AS total 
    FROM payments
  `;

  db.query(sql, (err, result) => {

    if (err) return res.json({ total: 0 });

    res.json(result[0]);

  });

});


app.put("/requests/:id", (req, res) => {

  const { status } = req.body;

  const sql = `
    UPDATE requests
    SET status=?
    WHERE id=?
  `;

  db.query(sql, [status, req.params.id], (err) => {

    if (err) return res.json({ status: "error" });

    // 🔔 (اختياري) تجيب user وترسل notification
    res.json({ status: "updated" });

  });

});

app.put("/update-booking/:id", (req, res) => {

  const { id } = req.params;
  const { status } = req.body;

  const sql = `
    UPDATE bookings
    SET status = ?
    WHERE id = ?
  `;

  db.query(sql, [status, id], (err) => {

    if (err) {
      console.log(err);

      return res.json({
        status: "error"
      });
    }

    res.json({
      status: "success"
    });

  });

});


app.use(express.json());

app.post("/orders", (req, res) => {

  console.log("ORDER BODY:", req.body);

  const { user_email, part_id, part_name, price, quantity } = req.body;

  const sql = `
    INSERT INTO orders (user_email, part_id, part_name, price, quantity)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql,
    [user_email, part_id, part_name, price, quantity],
    (err, result) => {

      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ error: err });
      }

      res.json({ message: "Order created successfully" });

    }
  );

});
app.put("/invoices/:id", (req, res) => {

  const { status } = req.body;

  const sql =
    "UPDATE invoices SET status = ? WHERE id = ?";

  db.query(
    sql,
    [status, req.params.id],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      res.json({
        message: "Invoice updated successfully"
      });

    }
  );

});

const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post("/requests-upload",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "voice", maxCount: 1 }
  ]),
  (req, res) => {

    console.log("🔥 BODY:", req.body);
    console.log("📁 FILES:", req.files);

    const { user_email, device, problem } = req.body;

    const image = req.files?.image?.[0]?.filename || null;
    const voice = req.files?.voice?.[0]?.filename || null;

    const sql = `
      INSERT INTO requests (user_email, device, problem, image, voice,status)
      VALUES (?, ?, ?, ?, ?,'Pending')
    `;

    db.query(sql,
      [user_email, device, problem, image, voice],
      (err) => {

        if (err) {
          console.log("❌ DB ERROR:", err);
          return res.json({
            status: "error",
            error: err.message
          });
        }

        console.log("✅ INSERT SUCCESS");

        res.json({ status: "success" });
      }
    );
  }
);


const axios = require("axios");




app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.json({
      status: "error",
      reply: "No message"
    });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
You are a professional device repair chatbot.
You help users diagnose problems and give step-by-step solutions.
Keep answers simple and clear.
            `
          },
          {
            role: "user",
            content: message
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    res.json({
      status: "success",
      reply: reply
    });

  } catch (error) {
    console.log("AI ERROR:", error.response?.data || error.message);

    res.json({
      status: "error",
      reply: "AI failed"
    });
  }
});

app.post("/posts", (req, res) => {
  const { user_email, user_name, device, problem } = req.body;

  const sql = `
    INSERT INTO posts (user_email, user_name, device, problem)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [user_email, user_name, device, problem], (err, result) => {
    if (err) {
      return res.json({ status: "error", err });
    }

    res.json({ status: "success" });
  });
});

app.get("/posts", (req, res) => {
  const sql = `
    SELECT p.*,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes,
    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
    FROM posts p
    ORDER BY p.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

app.post("/like", (req, res) => {
  const { post_id, user_email } = req.body;

  const sql = "INSERT INTO likes (post_id, user_email) VALUES (?, ?)";

  db.query(sql, [post_id, user_email], (err) => {
    if (err) return res.json({ status: "error" });

    res.json({ status: "liked" });
  });
});

app.get("/likes/:post_id", (req, res) => {
  const sql = "SELECT COUNT(*) as count FROM likes WHERE post_id = ?";

  db.query(sql, [req.params.post_id], (err, result) => {
    if (err) return res.json({ count: 0 });

    res.json(result[0]);
  });
});

app.post("/comment", (req, res) => {
  const { post_id, user_name, user_email, comment } = req.body;

  const sql = "INSERT INTO comments (post_id, user_name, user_email, comment) VALUES (?, ?, ?, ?)";

  db.query(sql, [post_id, user_name, user_email, comment], (err) => {
    if (err) return res.json({ status: "error" });
    res.json({ status: "success" });
  });
});

app.get("/comments/:id", (req, res) => {
  const sql = `
    SELECT * FROM comments
    WHERE post_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

app.delete("/posts/:id", (req, res) => {
  const postId = req.params.id;

  const sql = "DELETE FROM posts WHERE id = ?";

  db.query(sql, [postId], (err, result) => {
    if (err) return res.json({ status: "error", err });

    return res.json({ status: "success" });
  });
});

app.put("/posts/:id", (req, res) => {
  const postId = req.params.id;
  const { device, problem } = req.body;

  const sql = "UPDATE posts SET device=?, problem=? WHERE id=?";

  db.query(sql, [device, problem, postId], (err, result) => {
    if (err) return res.json({ status: "error", err });

    return res.json({ status: "success" });
  });
});

app.post("/save-post", (req, res) => {
  const { user_email, post_id } = req.body;

  const sql = "INSERT INTO saved_posts (user_email, post_id) VALUES (?, ?)";

  db.query(sql, [user_email, post_id], (err, result) => {
    if (err) return res.json({ status: "error", err });

    return res.json({ status: "success" });
  });
});

app.get("/saved-posts/:email", (req, res) => {
  const sql = `
    SELECT posts.*
    FROM posts
    JOIN saved_posts ON posts.id = saved_posts.post_id
    WHERE saved_posts.user_email = ?
  `;

  db.query(sql, [req.params.email], (err, result) => {
    if (err) return res.json({ status: "error" });
    res.json(result);
  });
});

// ================= GET PLACES =================

app.get("/places", (req, res) => {

  const sql = "SELECT * FROM places ORDER BY id DESC";

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        error: "Database error",
      });
    }

    res.json(result);
  });
});





app.post("/add-place", upload.single("image"), (req, res) => {

  const {
    name,
    description,
    category,
    region,
    city,
    services,
    location_url,
    phone,
    whatsapp,
  } = req.body;

  const image = req.file
    ? `http://192.168.0.105:5000/uploads/${req.file.filename}`
    : "";

  const sql = `
    INSERT INTO places
    (
      name,
      description,
      category,
      region,
      city,
      services,
      location_url,
      image,
      phone,
      whatsapp
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      name,
      description,
      category,
      region,
      city,
      services,
      location_url,
      image,
      phone,
      whatsapp,
    ],
    (err, result) => {

      if (err) {
        console.log(err);
        res.status(500).json({
          success: false,
        });
      } else {
        res.json({
          success: true,
          message: "Place added successfully",
        });
      }
    }
  );
});

app.get("/places", (req, res) => {

  db.query(
    "SELECT * FROM places ORDER BY id DESC",
    (err, result) => {

      if (err) {
        console.log(err);
      } else {
        res.json(result);
      }
    }
  );
});

app.get("/activities", (req, res) => {
  const sql = "SELECT * FROM activities ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

app.post("/activities", (req, res) => {
  const { title, device, solution, type } = req.body;

  const sql = `
    INSERT INTO activities (title, device, solution, type)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [title, device, solution, type], (err, result) => {
    if (err) return res.json(err);

    res.json({
      success: true,
      message: "Activity added"
    });
  });
});

app.post("/rate-technician", (req, res) => {
    const { id, rating } = req.body;

    db.query(
        "UPDATE technicians SET rating=? WHERE id=?",
        [rating, id],
        (err) => {
            if (err) return res.json({ status: "error" });

            res.json({ status: "success" });
        }
    );
});

app.get("/chat-users/:role/:email", (req, res) => {

  const { role, email } = req.params;

  let sql = "";

  if (role === "user") {

    sql = `
      SELECT name,email,role
      FROM users
      WHERE role IN ('admin','technician')
    `;
  }

  else if (role === "admin") {

    sql = `
      SELECT name,email,role
      FROM users
      WHERE role IN ('user','technician')
      AND email != ?
    `;
  }

  else if (role === "technician") {

    sql = `
      SELECT name,email,role
      FROM users
      WHERE role IN ('user','admin')
      AND email != ?
    `;
  }

  db.query(
    sql,
    role === "user" ? [] : [email],
    (err,result)=>{

      if(err){
        return res.status(500).json(err);
      }

      res.json(result);
    }
  );

});
app.post("/send-message", (req, res) => {

  const { sender_email, receiver_email, message } = req.body;

  const sql = `
    INSERT INTO chats (sender_email, receiver_email, message, is_read, created_at)
    VALUES (?, ?, ?, 0, NOW())
  `;

  db.query(sql, [sender_email, receiver_email, message], (err) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ error: true });
    }

    res.json({ success: true });

  });

});

app.get("/messages", (req, res) => {

  const {
    sender,
    receiver
  } = req.query;

  const sql = `
    SELECT *
    FROM chats
    WHERE
    (
      sender_email = ?
      AND receiver_email = ?
    )
    OR
    (
      sender_email = ?
      AND receiver_email = ?
    )
    ORDER BY created_at ASC
  `;

  db.query(
    sql,
    [
      sender,
      receiver,
      receiver,
      sender
    ],
    (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json(result);

    }
  );

});

app.get("/unread-count/:email", (req, res) => {

  const email = req.params.email;

  const sql = `
    SELECT COUNT(*) AS count
    FROM chats
    WHERE receiver_email = ? AND is_read = 0
  `;

  db.query(sql, [email], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json({ count: result[0].count });

  });

});

app.post("/mark-read", (req, res) => {

  const { receiver, sender } = req.body;

  const sql = `
    UPDATE chats
    SET is_read = 1
    WHERE receiver_email = ? AND sender_email = ?
  `;

  db.query(sql, [receiver, sender], (err) => {

    if (err) return res.status(500).json(err);

    res.json({ success: true });

  });

});

app.post("/sell-request", (req, res) => {
  const { user_email, image, price, description } = req.body;

  const sql = `
    INSERT INTO sell_requests (user_email, image, price, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [user_email, image, price, description], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Request created", id: result.insertId });
  });
});
app.get("/sell-requests", (req, res) => {
  db.query("SELECT * FROM sell_requests ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.put("/sell-request/:id/status", (req, res) => {
  const { status } = req.body;

  db.query(
    "UPDATE sell_requests SET status = ? WHERE id = ?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Updated" });
    }
  );
});
// START SERVER
app.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});


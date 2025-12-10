const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_PORT
} = process.env;

async function getConn(){
  return mysql.createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    port: MYSQL_PORT || 3306
  });
}

app.post('/state', async (req, res) => {
  const state = (req.body.state || '').toUpperCase();
  if (state !== 'OPEN' && state !== 'CLOSE') {
    return res.status(400).send('INVALID');
  }

  const conn = await getConn();

  const [rows] = await conn.query("SELECT state FROM door_state LIMIT 1");
  const current = rows[0]?.state || null;

  if (current !== state) {
    if (current === null) {
      await conn.query("INSERT INTO door_state(state) VALUES(?)", [state]);
    } else {
      await conn.query("UPDATE door_state SET state=?, updated_at=NOW()", [state]);
    }
    await conn.query("INSERT INTO door_log(state) VALUES(?)", [state]);
  }

  await conn.end();
  res.send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

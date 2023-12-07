let express = require("express");
let app = express();
let jwt = require("jsonwebtoken");
app.listen(3000);
console.log("Servern körs på port 3000");

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/main.html");
});

let mysql = require("mysql");
con = mysql.createConnection( {
    host: "localhost",
    user: "root",
    password: "",
    database: "frontend23",
    multipleStatements: true,
});


const COLUMNS = ["id", "name", "username", "password", "email"];


//Hämtar befinlig användarinformation, behövs logga in med token för att se. 
app.get("/users", function (req, res) {
    let authHeader = req.headers["authorization"];
    if (authHeader === undefined) {
        res.sendStatus(400);
        return;
    }
    let token = authHeader.slice(7);
    console.log(token);

    let decoded;
    try {
        decoded = jwt.verify(token, "HemligtokensomintekanavkodasXy6333%/&");
    } catch (err) {
        console.log(err);
        res.status(401).send("Wrong token try again!");
        return;
    }
    console.log(decoded);
    console.log(`Hejsan ${decoded.name}! Vi har skickat ett uppdaterat användaravtal till din mail ${decoded.email}.`);
    let sql = "SELECT * FROM inlamning";
    let condition = createCondition(req.query);
    console.log(sql + condition);
    con.query(sql + condition, function (err, result, fields) {
        res.send(result);
    });
});

let createCondition = function (query) {
    console.log(query);
    let output = " WHERE ";
    for (let key in query) {
        if (COLUMNS.inkludes(key)) {
            output += `${key}="${query[key]}" OR `;
        }
    }
    if (output.length == 7) {
        return "";
    } else {
        return output.substring(0, output.length - 4);
    }
};

//Välja specifik användare, när man har loggat in med token. 
app.get("/users/:id", function (req, res) {
    let authHeader = req.headers["authorization"];
    if (authHeader === undefined) {
        res.sendStatus(400);
        return;
    }
    let token = authHeader.slice(7);
    console.log(token);

    let decoded;
    try {
        decoded = jwt.verify(token, "HemligtokensomintekanavkodasXy6333%/&");
    } catch (err) {
        console.log(err);
        res.status(401).send("Wrong token try again!");
        return;
    }
    console.log(decoded);
    console.log(`Hejsan ${decoded.name}! Vi har skickat ett uppdaterat användaravtal till din mail ${decoded.email}.`);
    let sql = "SELECT * FROM inlamning WHERE id=" + req.params.id;
    console.log(sql);
    con.query(sql, function (err, result, fields) {
        if (result.length > 0) {
            res.send(result);    
        } else {
            res.sendStatus(404);
        }
    });
});

app.use(express.json());

const crypto = require("crypto");
function hash(data) {
    const hash = crypto.createHash("sha256");
    hash.update(data);
    return hash.digest("hex");
}

//Lägga till ny användare i databasen, med hasning. 
app.post("/users", function (req, res) {
    if (!req.body.username) {
        res.status(400).send ("username required!");
        return;
    }
let fields = ["username", "password", "name", "email"];
for (let key in req.body) {
    if (!fields.includes(key)) {
        res.status(400).send("Unkown field:" + key);
        return;
    }
}

let sql = `INSERT INTO inlamning (username, email, name, password)
VALUES ('${req.body.username}', 
'${req.body.email}',
'${req.body.name}',
'${hash(req.body.password)}');
SELECT LAST_INSERT_ID();`; 
console.log(sql);

con.query(sql, function (err, result, fields) {
    if (err) throw err;
    console.log(result);
    let output = {
      id: result[0].insertId,
      username: req.body.username,
      name: req.body.name,
      email: req.body.email, 
    };
    res.send(output);
  });
});

//Hämtar data från databas för att logga in, skapar även en token för att kunna se users och users:id.
app.post("/login", function (req, res) {
    if((!req.body && req.body.username && req.body.password)) {
        res.sendStatus(400);
        return;
    }
    let sql = `SELECT * FROM inlamning WHERE username='${req.body.username}'`;
  
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      if (result.length == 0) {
        res.status(400).send("Felaktigt användarnamn eller lösenord");
        return;
      }
      let passwordHash = hash(req.body.password);
      console.log(passwordHash);
      console.log(result[0].password);
      if (result[0].password == passwordHash) {
        let payload = {
          name: result[0].name,
          sub: result[0].username,
          email: result[0].email,
        };
        let token = jwt.sign(payload, "HemligtokensomintekanavkodasXy6333%/&");
        res.json(token);
      } else {
        res.status(401).send("Felaktigt användarnamn eller lösenord");
      }
    });
  });  


//Ändrar befintlig data, denna satt jag längst ner då detta ska få med hashning.    
app.put("/users/:id", function (req, res) {
    if (!(req.body && req.body.name && req.body.email && req.body.password)) {
        res.sendStatus(400);
        return;
    }
    let sql = `UPDATE inlamning
            SET name = '${req.body.name}', email = '${req.body.email}', password = '${hash(req.body.password)}'
            WHERE id = ${req.params.id}`;

    con.query(sql, function (err, result, fields) {
        if (err) {
            throw err;
        } else {
            res.status(200).send("Ändring lyckades!");
        }
    });
});

/* Jag har använt samma variabelnamn som dina exempel, men koden har jag försökt att klura med själv.  */
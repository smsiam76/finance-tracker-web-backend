const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// const uri = "mongodb+srv://<db_username>:<db_password>@cluster1.fc0jkus.mongodb.net/?appName=Cluster1";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.fc0jkus.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // --------------------=--------------------
    //      Database Collection List
    //---------------------=-------------------
    const usersCollection = client
      .db("financeTracker_DB")
      .collection("usersDB");
    const booksCollection = client
      .db("financeTracker_DB")
      .collection("booksDB");
    const categoriesCollection = client
      .db("financeTracker_DB")
      .collection("categoriesDB");
    const transactionsCollection = client
      .db("financeTracker_DB")
      .collection("transactionsDB");

    // --------------------=--------------------
    //      Users Database with API
    //---------------------=-------------------

    app.get("/users", async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};

        if (email) {
          query = { email: email };
          const user = await usersCollection.findOne(query);

          if (!user) {
            return res.status(404).send({ message: "User not found" });
          }

          return res.send(user);
        }

        // if no email parameter get all users
        const result = await usersCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch users data" });
      }
    });

    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };

        // check existing user
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.send({ message: "User already exists", insertedId: null });
        }

        // new user inserted from here
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to insert User data" });
      }
    });

    // --------------------=--------------------
    //      Books Database with API
    //---------------------=-------------------

    // get all books / query by email books
    app.get("/books", async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};
        
        if (email) {
          query = { "createdBy.email": email.trim() };
        }
        const result = await booksCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch books" });
      }
    });

    // get books using id
    app.get("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const bookData = await booksCollection.findOne(query);

        if (!bookData) {
          return res.status(404).send({ message: "Book not found" });
        }
        res.send(bookData);
      } catch (error) {
        return res.status(500).send("Failed to fetch books");
      }
    });

    // create books api
    app.post("/books", async (req, res) => {
      try {
        const bookData = req.body;
        const result = await booksCollection.insertOne(bookData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to insert book data" });
      }
    });

    // book update api
    app.patch("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updatedData = req.body;

        const updateDoc = {
          $set: {
            ...updatedData,
            updatedAt: new Date(),
          },
        };
        const result = await booksCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update book" });
      }
    });

    // book delete api
    app.delete("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await booksCollection.deleteOne(query);

        res.send(result);
      } catch (error) {
        res.status(500).send("Failed to delete books");
      }
    });


     // --------------------=--------------------
    //      Categories Database with API
    //---------------------=-------------------
     app.post("/categories", async (req, res) => {
      try {
        const categoriesData = req.body;
        const result = await categoriesCollection.insertOne(categoriesData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to insert book data" });
      }
    });

    app.get("/categories", async (req, res) => {
      try {
        const email = req.query.email;
        let query = {};
        
        if (email) {
          query = { userEmail: email.trim() };
        }
        const result = await categoriesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch books" });
      }
    });


    
    // --------------------=--------------------
    //      Cash in Database with API
    //---------------------=-------------------

    app.post("/transactions", async (req, res) => {
      try{

        const transactionData = req.body;
        const result = await transactionsCollection.insertOne(transactionData);
        res.send(result);

      } catch (error) {
         res.status(500).send({ error: "Failed to insert transaction" });
      }
    })

    app.get("/transactions", async (req, res) => {
      try{
        const {email, type, bookId} = req.query;
        let query = {};
        
        if (email) {
          query = { userEmail: email.trim() };
        }
        if(type) {
          query.type = type;
        }
        if(bookId) {
          query.bookId = bookId;
        }
        
        const result = await categoriesCollection.find(query).sort({date: -1}).toArray();
        res.send(result);

      } catch (error) {
        res.status(500).send({ error: "Failed to fetch transactions" });
      }
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

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
    const budgetsCollection = client
      .db("financeTracker_DB")
      .collection("budgetsDB");
    const debtsCollection = client
      .db("financeTracker_DB")
      .collection("debtsDB");

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
        let query = { $or: [{ isDefault: true }, { userEmail: email }] };

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
    //      Transactions Database with API
    //---------------------=-------------------

    // app.post("/transactions", async (req, res) => {
    //   try {
    //     const transactionData = req.body;
    //     const result = await transactionsCollection.insertOne(transactionData);
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ error: "Failed to insert transaction" });
    //   }
    // });
    // app.post("/transactions", async (req, res) => {
    //   try {
    //     const transactionData = req.body;

    //     const result = await transactionsCollection.insertOne(transactionData);

    //     // code for update balance in books
    //     if (result.insertedId) {
    //       const amount = parseFloat(transactionData.amount);
    //       const bookId = transactionData.bookId;

    //       // transaction type to update or modify
    //       let bookUpdate = {};

    //       if (transactionData.type === "CASH_IN") {
    //         bookUpdate = {
    //           $inc: {
    //             currentBalance: amount,
    //             totalIncome: amount,
    //           },
    //         };
    //       } else if (transactionData.type === "CASH_OUT") {
    //         bookUpdate = {
    //           $inc: {
    //             currentBalance: -amount,
    //             totalExpense: amount,
    //           },
    //         };
    //       }
    //       // books update in DB
    //       await booksCollection.updateOne(
    //         { _id: new ObjectId(bookId) },
    //         bookUpdate,
    //       );
    //     }

    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ error: "Failed to insert transaction" });
    //   }
    // });
    app.post("/transactions", async (req, res) => {
      try {
        const transactionData = req.body;
        const result = await transactionsCollection.insertOne(transactionData);

        if (result.insertedId) {
          const amount = parseFloat(transactionData.amount);

          if (transactionData.type === "CASH_IN") {
            await booksCollection.updateOne(
              { _id: new ObjectId(transactionData.bookId) },
              { $inc: { currentBalance: amount, totalIncome: amount } },
            );
          } else if (transactionData.type === "CASH_OUT") {
            await booksCollection.updateOne(
              { _id: new ObjectId(transactionData.bookId) },
              { $inc: { currentBalance: -amount, totalExpense: amount } },
            );
          } else if (transactionData.type === "TRANSFER") {
            const { sourceBookId, destinationBookId } =
              transactionData.transferDetails;

            // Source Book balance deduction
            await booksCollection.updateOne(
              { _id: new ObjectId(sourceBookId) },
              { $inc: { currentBalance: -amount } },
            );

            // Destination Book balance addition
            await booksCollection.updateOne(
              { _id: new ObjectId(destinationBookId) },
              { $inc: { currentBalance: amount } },
            );
          }
        }

        res.send(result);
      } catch (error) {
        console.error("Transaction Creation Error:", error);
        res.status(500).send({ error: "Failed to insert transaction" });
      }
    });

    app.get("/transactions", async (req, res) => {
      try {
        const { email, type, bookId } = req.query;
        let query = {};

        if (email) {
          query = { userEmail: email.trim() };
        }
        if (type) {
          query.type = type;
        }
        // Check both main bookId and destinationBookId inside transferDetails
        if (bookId) {
          // query.bookId = bookId;
          query.$or = [
            { bookId: bookId },
            { "transferDetails.destinationBookId": bookId },
          ];
        }

        const result = await transactionsCollection
          .aggregate([
            { $match: query },
            { $sort: { date: -1 } },
            // Safe Object ID conversion for Book
            {
              $addFields: {
                convertedBookId: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$bookId", null] },
                        { $ne: ["$bookId", ""] },
                      ],
                    },
                    { $toObjectId: "$bookId" },
                    null,
                  ],
                },
                convertedCategoryId: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$categoryId", null] },
                        { $ne: ["$categoryId", ""] },
                      ],
                    },
                    { $toObjectId: "$categoryId" },
                    null,
                  ],
                },
              },
            },
            // Lookup Book Details
            {
              $lookup: {
                from: "booksDB",
                localField: "convertedBookId",
                foreignField: "_id",
                as: "bookDetails",
              },
            },
            {
              $unwind: {
                path: "$bookDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            // Lookup Category Details
            {
              $lookup: {
                from: "categoriesDB",
                localField: "convertedCategoryId",
                foreignField: "_id",
                as: "categoryDetails",
              },
            },
            {
              $unwind: {
                path: "$categoryDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            // Only Keep Required & Important Fields
            {
              $project: {
                _id: 1,
                amount: 1,
                bookId: 1,
                type: 1,
                date: 1,
                note: 1,
                categoryId: 1,
                userEmail: 1,
                transferDetails: 1,
                bookDetails: {
                  name: "$bookDetails.bookName",
                  icon: "$bookDetails.icon",
                  color: "$bookDetails.themeColor",
                },
              },
            },
          ])
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch transactions" });
      }
    });
    // app.get("/transactions", async (req, res) => {
    //   try {
    //     const { email, type, bookId } = req.query;
    //     let query = {};

    //     if (email) {
    //       query = { userEmail: email.trim() };
    //     }
    //     if (type) {
    //       query.type = type;
    //     }
    //     // Check both main bookId and destinationBookId inside transferDetails
    //     if (bookId) {
    //       // query.bookId = bookId;
    //       query.$or = [
    //         { bookId: bookId },
    //         { "transferDetails.destinationBookId": bookId },
    //       ];
    //     }

    //     const result = await transactionsCollection
    //       .find(query)
    //       .sort({ date: -1 })
    //       .toArray();
    //     res.send(result);
    //   } catch (error) {
    //     res.status(500).send({ error: "Failed to fetch transactions" });
    //   }
    // });

    // --------------------=--------------------
    //      Budgets Database with API
    //---------------------=-------------------

    app.post("/budgets", async (req, res) => {
      try {
        const budgetData = req.body;

        const result = await budgetsCollection.insertOne(budgetData);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to insert budget data" });
      }
    });
    //  2. Get Budgets (filter by userEmail, bookId, category, month)
    app.get("/budgets", async (req, res) => {
      try {
        const { email, bookId, category, month } = req.query;
        let query = {};

        if (email) {
          query.userEmail = email.trim();
        }
        if (bookId) {
          query.bookId = bookId;
        }
        if (category) {
          query.category = category;
        }
        if (month) {
          query.month = month; // Format example: "2026-03"
        }

        const result = await budgetsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch budgets" });
      }
    });

    app.get("/budgets/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const budget = await budgetsCollection.findOne(query);

        if (!budget) {
          return res.status(404).send({ message: "Budget not found" });
        }
        res.send(budget);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch budget" });
      }
    });

    // 4. Update Budget by ID
    app.patch("/budgets/:id", async (req, res) => {
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

        const result = await budgetsCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update budget" });
      }
    });

    // 5. Delete Budget by ID
    app.delete("/budgets/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await budgetsCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).send({ message: "Budget not found" });
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to delete budget" });
      }
    });

    // =----------------------------------------
    // DASHBOARD SUMMARY API
    // =----------------------------------------
    app.get("/dashboard/summary", async (req, res) => {
      try {
        const { email } = req.query;
        if (!email)
          return res
            .status(400)
            .send({ error: "Email query parameter is required" });
        const userEmail = email.trim();

        // Calculate Net Balance across all user books
        const books = await booksCollection
          .find({ "createdBy.email": userEmail })
          .toArray();
        const totalNetBalance = books.reduce(
          (sum, book) => sum + (parseFloat(book.currentBalance) || 0),
          0,
        );

        // Aggregate income and expense stats
        const transactionStats = await transactionsCollection
          .aggregate([
            { $match: { userEmail: userEmail } },
            {
              $group: {
                _id: "$type",
                totalAmount: { $sum: { $toDouble: "$amount" } },
              },
            },
          ])
          .toArray();

        let totalExpense = 0;
        let totalIncome = 0;

        transactionStats.forEach((stat) => {
          if (stat._id === "CASH_OUT") totalExpense = stat.totalAmount;
          if (stat._id === "CASH_IN") totalIncome = stat.totalAmount;
        });

        const netSavings = totalIncome - totalExpense;

        // Categorized expenses
        // Categorized expenses
        const categoryExpenses = await transactionsCollection
          .aggregate([
            {
              $match: {
                userEmail: userEmail,
                type: "CASH_OUT",
                categoryId: { $ne: null, $exists: true },
              },
            },
            {
              $addFields: {
                // String categoryId কে ObjectId তে রূপান্তর
                convertedCategoryId: { $toObjectId: "$categoryId" },
              },
            },
            {
              $lookup: {
                from: "categoriesDB",
                localField: "convertedCategoryId",
                foreignField: "_id",
                as: "categoryDetails",
              },
            },
            { $unwind: "$categoryDetails" },
            {
              $group: {
                _id: "$categoryDetails.name",
                amount: { $sum: { $toDouble: "$amount" } },
                color: { $first: "$categoryDetails.color" },
              },
            },
            {
              $project: {
                name: "$_id",
                category: "$_id",
                amount: 1,
                color: 1,
                _id: 0,
              },
            },
          ])
          .toArray();

        // Total budgeted calculation
        const budgets = await budgetsCollection
          .find({ userEmail: userEmail })
          .toArray();
        const totalBudgeted = budgets.reduce(
          (sum, b) => sum + (parseFloat(b.budgetAmount) || 0),
          0,
        );

        res.send({
          metrics: {
            totalNetBalance,
            totalBudgeted,
            totalExpense,
            netSavings,
          },
          categoryExpenses,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to load dashboard summary" });
      }
    });

    // =----------------------------------------
    // BUDGET VS EXPENSE OVERVIEW API (Optimized Aggregation)
    // =----------------------------------------
    // app.get("/dashboard/budget-overview", async (req, res) => {
    //   try {
    //     const { email } = req.query;
    //     if (!email) return res.status(400).send({ error: "Email is required" });
    //     const userEmail = email.trim();

    //     const budgetOverview = await budgetsCollection
    //       .aggregate([
    //         { $match: { userEmail } },
    //         {
    //           $lookup: {
    //             from: "transactionsDB",
    //             let: { catName: "$category", userEmail: "$userEmail" },
    //             pipeline: [
    //               {
    //                 $match: {
    //                   $expr: {
    //                     $and: [
    //                       { $eq: ["$userEmail", "$$userEmail"] },
    //                       { $eq: ["$type", "CASH_OUT"] },
    //                       { $eq: ["$category", "$$catName"] },
    //                     ],
    //                   },
    //                 },
    //               },
    //               {
    //                 $group: {
    //                   _id: null,
    //                   totalSpent: { $sum: { $toDouble: "$amount" } },
    //                 },
    //               },
    //             ],
    //             as: "spentData",
    //           },
    //         },
    //         {
    //           $project: {
    //             _id: 1,
    //             name: "$category",
    //             spent: {
    //               $ifNull: [{ $arrayElemAt: ["$spentData.totalSpent", 0] }, 0],
    //             },
    //             total: { $toDouble: { $ifNull: ["$budgetAmount", 0] } },
    //           },
    //         },
    //       ])
    //       .toArray();

    //     res.send(budgetOverview);
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).send({ error: "Failed to calculate budget overview" });
    //   }
    // });

    app.get("/dashboard/budget-overview", async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) return res.status(400).send({ error: "Email is required" });
        const userEmail = email.trim();

        const budgetOverview = await budgetsCollection
          .aggregate([
            { $match: { userEmail } },
            {
              $lookup: {
                from: "transactionsDB",
                let: { catName: "$category", userEmail: "$userEmail" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$userEmail", "$$userEmail"] },
                          { $eq: ["$type", "CASH_OUT"] },
                        ],
                      },
                    },
                  },
                  {
                    $addFields: {
                      convertedCategoryId: { $toObjectId: "$categoryId" },
                    },
                  },
                  {
                    $lookup: {
                      from: "categoriesDB",
                      localField: "convertedCategoryId",
                      foreignField: "_id",
                      as: "cat",
                    },
                  },
                  { $unwind: "$cat" },
                  {
                    $match: {
                      $expr: { $eq: ["$cat.name", "$$catName"] },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      totalSpent: { $sum: { $toDouble: "$amount" } },
                    },
                  },
                ],
                as: "spentData",
              },
            },
            {
              $project: {
                _id: 1,
                name: "$category",
                spent: {
                  $ifNull: [{ $arrayElemAt: ["$spentData.totalSpent", 0] }, 0],
                },
                total: { $toDouble: { $ifNull: ["$budgetAmount", 0] } },
              },
            },
          ])
          .toArray();

        res.send(budgetOverview);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to calculate budget overview" });
      }
    });

    // --------------------=--------------------
    //      Reports Database with API
    // --------------------=--------------------

    // Get Analytics Data filtered by Period (Daily, Weekly, Monthly, Yearly)
    app.get("/reports/analytics", async (req, res) => {
      try {
        const { email, period = "Monthly" } = req.query;

        if (!email) {
          return res.status(400).send({ error: "Email is required" });
        }

        const userEmail = email.trim();
        const currentDate = new Date();
        let startDate = new Date();

        // Date range setup according to period filter
        if (period === "Daily") {
          startDate.setHours(0, 0, 0, 0);
        } else if (period === "Weekly") {
          startDate.setDate(currentDate.getDate() - 7);
        } else if (period === "Monthly") {
          startDate.setMonth(currentDate.getMonth() - 1);
        } else if (period === "Yearly") {
          startDate.setFullYear(currentDate.getFullYear() - 1);
        }

        // Match query for transactions within date range
        const matchQuery = {
          userEmail,
          date: { $gte: startDate.toISOString() },
        };

        // Calculate total income and total expense for selected period
        const stats = await transactionsCollection
          .aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: "$type",
                total: { $sum: { $toDouble: "$amount" } },
              },
            },
          ])
          .toArray();

        let totalIncome = 0;
        let totalExpense = 0;

        stats.forEach((item) => {
          if (item._id === "CASH_IN") totalIncome = item.total;
          if (item._id === "CASH_OUT") totalExpense = item.total;
        });

        const currentBalance = totalIncome - totalExpense;

        // Balance Trend over time for Chart
        const balanceTrend = await transactionsCollection
          .aggregate([
            { $match: matchQuery },
            {
              $group: {
                _id: { $substr: ["$date", 0, 10] }, // Format: YYYY-MM-DD
                totalIncome: {
                  $sum: {
                    $cond: [
                      { $eq: ["$type", "CASH_IN"] },
                      { $toDouble: "$amount" },
                      0,
                    ],
                  },
                },
                totalExpense: {
                  $sum: {
                    $cond: [
                      { $eq: ["$type", "CASH_OUT"] },
                      { $toDouble: "$amount" },
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                time: "$_id",
                balance: { $subtract: ["$totalIncome", "$totalExpense"] },
              },
            },
          ])
          .toArray();

        // Expenses grouped by Category for Pie Chart (UPDATED HERE)
        const categories = await transactionsCollection
          .aggregate([
            {
              $match: {
                userEmail,
                type: "CASH_OUT",
                date: { $gte: startDate.toISOString() },
                categoryId: { $ne: null, $exists: true, $ne: "" },
              },
            },
            {
              $addFields: {
                convertedCategoryId: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ["$categoryId", null] },
                        { $ne: ["$categoryId", ""] },
                      ],
                    },
                    { $toObjectId: "$categoryId" },
                    null,
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "categoriesDB",
                localField: "convertedCategoryId",
                foreignField: "_id",
                as: "cat",
              },
            },
            { $unwind: { path: "$cat", preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: "$cat.name",
                value: { $sum: { $toDouble: "$amount" } },
                color: { $first: "$cat.color" },
              },
            },
            {
              $project: {
                _id: 0,
                name: "$_id",
                category: "$_id",
                value: 1,
                color: 1,
              },
            },
          ])
          .toArray();

        res.send({
          totalIncome,
          totalExpense,
          currentBalance,
          incomeGrowth: "+12.5%",
          expenseGrowth: "-4.2%",
          balanceTrend,
          categories,
        });
      } catch (error) {
        console.error("Reports API Error:", error);
        res.status(500).send({ error: "Failed to fetch report analytics" });
      }
    });
    // 2. Get Overall Lifetime Metrics
    app.get("/reports/overall", async (req, res) => {
      try {
        const { email } = req.query;

        if (!email) {
          return res.status(400).send({ error: "Email is required" });
        }

        const userEmail = email.trim();

        const overallStats = await transactionsCollection
          .aggregate([
            { $match: { userEmail } },
            {
              $group: {
                _id: "$type",
                totalAmount: { $sum: { $toDouble: "$amount" } },
                totalCount: { $sum: 1 },
              },
            },
          ])
          .toArray();

        res.send(overallStats);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch overall analytics" });
      }
    });

    // --------------------=--------------------
    //      Lent and Borrowed Database with API
    // --------------------=--------------------
    app.post("/debts", async (req, res) => {
      try {
        const debtData = req.body;

        const result = await debtsCollection.insertOne(debtData);

        res.send(result);
      } catch (error) {
        console.error("Create Debt Error:", error);
        res.status(500).send({ error: "Failed to create debt record" });
      }
    });
    // Get All Debts (Filter by email/userId, type, status, or bookId)
    app.get("/debts", async (req, res) => {
      try {
        const { email, userId, type, status, bookId } = req.query;
        let query = {};

        if (email) query.userEmail = email.trim();
        if (userId) query.userId = userId;
        if (type) query.type = type;
        if (status) query.status = status;
        if (bookId) query.bookId = bookId;

        const result = await debtsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch debt records" });
      }
    });

    app.patch("/debts/settle/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const { amount, note } = req.body;
        const filter = { _id: new ObjectId(id) };

        const debt = await debtsCollection.findOne(filter);
        if (!debt) {
          return res.status(404).send({ error: "Debt record not found" });
        }

        const currentBalance = Number(debt.remainingBalance) || 0;
        const paymentAmount = Number(amount) || currentBalance;
        const newRemainingBalance = Math.max(0, currentBalance - paymentAmount);

        // Status update: balance 0 hole 'PAID', na hole 'PARTIAL'
        const newStatus = newRemainingBalance === 0 ? "PAID" : "PARTIAL";

        const updateDoc = {
          $set: {
            remainingBalance: newRemainingBalance,
            status: newStatus,
            updatedAt: new Date(),
          },
          $push: {
            settlements: {
              amount: paymentAmount,
              note: note || "Settlement Payment",
              date: new Date(),
            },
          },
        };

        const result = await debtsCollection.updateOne(filter, updateDoc);
        res.send({
          success: true,
          result,
          remainingBalance: newRemainingBalance,
          status: newStatus,
        });
      } catch (error) {
        console.error("Settle Debt Error:", error);
        res.status(500).send({ error: "Failed to settle debt record" });
      }
    });
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

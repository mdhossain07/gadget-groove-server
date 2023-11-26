const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esabfel.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const productCollection = client.db("gadgetDB").collection("products");
    const userCollection = client.db("gadgetDB").collection("users");
    const reviewCollection = client.db("gadgetDB").collection("reviews");
    const reportCollection = client.db("gadgetDB").collection("reports");
    const voteCollection = client.db("gadgetDB").collection("votes");

    // Products related API

    app.post("/api/v1/add-product", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    app.get("/api/v1/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    app.get("/api/v1/user-product", async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { user_email: req.query.email };
      }
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/product/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    app.patch("/api/v1/update-product/:id", async (req, res) => {
      const product = req.body;
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateProduct = {
        $set: {
          product_name: product.product_name,
          product_category: product.product_category,
          product_image: product.product_image,
          product_description: product.product_description,
          product_tags: product.product_tags,
          external_link: product.external_link,
        },
      };
      const result = await productCollection.updateOne(filter, updateProduct);
      res.send(result);
    });

    app.delete("/api/v1/delete-product/:id", async (req, res) => {
      const { id } = req.params;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    // products query related API

    app.patch("/api/v1/update-status/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: { status: "accepted" },
      };
      const result = await productCollection.updateOne(filter, updateStatus);
      res.send(result);
    });

    app.patch("/api/v1/make-featured/:id", async (req, res) => {
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: { featured: "yes" },
      };
      const result = await productCollection.updateOne(filter, updateStatus);
      res.send(result);
    });

    app.get("/api/v1/featured-products", async (req, res) => {
      let query = {};
      if (req.query.featured) {
        query = { featured: req.query.featured };
      }
      const result = await productCollection
        .find(query)
        .sort({ timestamp: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/api/v1/trending-products", async (req, res) => {
      const result = await productCollection
        .find()
        .sort({ vote: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/api/v1/accepted-products", async (req, res) => {
      let query = {};
      if (req.query.status) {
        query = { status: req.query.status };
      }
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/search-products", async (req, res) => {
      const { tags } = req.query;
      const query = {
        product_tags: { $in: tags.split(",") },
      };
      console.log(query);
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });

    // users related API

    app.post("/api/v1/add-user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExist = await userCollection.findOne(query);
      if (isExist) {
        return res.send({ message: "user already exist" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/api/v1/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.patch("/api/v1/make-admin/:id", async (req, res) => {
      const { id } = req.params;
      const user = req.body;
      const filter = { _id: new ObjectId(id) };
      const upadteUser = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, upadteUser);
      res.send(result);
    });

    app.patch("/api/v1/make-moderator/:id", async (req, res) => {
      const { id } = req.params;
      const user = req.body;
      const filter = { _id: new ObjectId(id) };
      const upadteUser = {
        $set: {
          role: "moderator",
        },
      };
      const result = await userCollection.updateOne(filter, upadteUser);
      res.send(result);
    });

    // admin API

    app.get("/api/v1/user/admin/:email", async (req, res) => {
      const { email } = req.params;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send(admin);
    });

    // moderator API

    app.get("/api/v1/user/moderator/:email", async (req, res) => {
      const { email } = req.params;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let moderator = false;
      if (user) {
        moderator = user?.role === "moderator";
      }
      res.send(moderator);
    });

    // reviews related API

    app.post("/api/v1/add-review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get("/api/v1/reviews", async (req, res) => {
      let query = {};
      if (req.query.sid) {
        query = { sid: req.query.sid };
      }
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });

    // vote related API

    app.patch("/api/v1/increase-vote/:id", async (req, res) => {
      const vote = req.body;
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateVote = {
        $inc: { vote: 1 },
      };
      const result = await productCollection.updateOne(filter, updateVote);
      res.send(result);
    });

    app.patch("/api/v1/decrease-vote/:id", async (req, res) => {
      const vote = req.body;
      const { id } = req.params;
      const filter = { _id: new ObjectId(id) };
      const updateVote = {
        $inc: { vote: -1 },
      };
      const result = await productCollection.updateOne(filter, updateVote);
      res.send(result);
    });

    app.post("/api/v1/make-vote", async (req, res) => {
      const { user, product_id } = req.body;
      const isVoted = await voteCollection.findOne({ user, product_id });
      if (isVoted) {
        return res.send({ message: "User already voted this product" });
      }
      const result = await voteCollection.insertOne({
        user,
        product_id,
        voteCount: 1,
      });
      res.send(result);
    });

    // reports related API

    app.post("/api/v1/make-report", async (req, res) => {
      const report = req.body;
      const result = await reportCollection.insertOne(report);
      res.send(result);
    });

    app.get("/api/v1/reports", async (req, res) => {
      const result = await reportCollection.find().toArray();
      res.send(result);
    });

    app.delete("/api/v1/delete-report/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await reportCollection.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Gadget Groover Server is running!");
});

app.listen(port, () => {
  console.log(`server has stared on port ${port}`);
});

const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
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

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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

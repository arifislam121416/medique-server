const express = require('express')
require('dotenv').config()
const app = express()
const cors = require("cors")
app.use(cors())
const port = process.env.PORT || 8080

// #3IGaY6nJbfthne9K
// #medique-server


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://medique-server:3IGaY6nJbfthne9K@cluster0.m08btp0.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const tutoralData = async () =>{
    const data = await client.db("medique-server");
    const tutorialCollection = data.collection()

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const tutorialData = client.db("medique-server");
    const tutorialCollection = tutorialData.collection("tutorals");

app.get("/tutorals", async (req, res) =>{
    const cursor = tutorialCollection.find();
    const result = await cursor.toArray();
    res.send(result)
})

app.get("/tutorals/:id", async (req, res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await tutorialCollection.findOne(query);
    res.send(result)
})

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }

  
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

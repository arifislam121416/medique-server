const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const loggerMiddleware =  (req, res,next)=>{
      console.log(`${req.method} | ${req.url}`)
next();
    };

    const tokenVerificationMiddleware = async (req, res, next) => {

      const { authorization} = req.headers;
      const token = authorization?.split(" ")[1];
      
      if(!token){
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        })
      }

      try {
    const JWKS = createRemoteJWKSet(
  new URL(`${process.env.AUTH_URL}/api/auth/jwks`)
)
    const { payload } = await jwtVerify(
  token,
  JWKS,
  {
    issuer: process.env.AUTH_URL,
  }
);
    req.user = payload;
    console.log("token verified" , payload);
    next();
  } catch (error) {
    console.error('Token validation failed:', error)
    return res.status(401).json({
          success: false,
          message: "Unauthorized",
        })
  }
    };

async function run() {


  try {
    await client.connect();
    const db = client.db("medique-server");
    const tutorialCollection = db.collection("tutorals");
    const bookingCollection = db.collection("bookings");
    const enrollmentCollection = db.collection("enrollments");

    app.get("/tutorals", async (req, res) => {
      const {search} = req.query;
      let cursor;
      if(search){
        cursor = tutorialCollection.find({title: {$regex: search, $options: "i"}});
      }else{
        cursor = tutorialCollection.find();
      }
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/tutorals/:id",
     loggerMiddleware,
       async (req, res) => {
      try {
        const { id } = req.params;

        const result = await tutorialCollection.findOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
  console.error(error);

  res.status(400).json({
    success: false,
    message: "Invalid ID",
  });
}
    });
app.patch("/enroll/:id", tokenVerificationMiddleware, async (req, res) =>{
  const {id} = req.params;
  const enrollData = req.body;
  const tutorial = await tutorialCollection.findOne({_id: new ObjectId(id)});
  if(!tutorial){
  return res.status(404).json({
    success: false,
    message: "Tutorial not found",
  });
}
await tutorialCollection.updateOne(
  {_id: new ObjectId(id)},
  {
    $inc: { enrollCount: 1 },
    $set: { lastEnrolledAt: new Date() },
  }
);
const result = await enrollmentCollection.insertOne({
  ...enrollData,
  tutorialId: id,
  enrolledAt: new Date(),
});
res.send(result);
})
    app.get("/availabletutorials", async (req, res) => {
      const result = await tutorialCollection
        .find()
        .limit(6)
        .toArray();

      res.send(result);
    });

    app.post("/addtutorals", async (req, res) => {
      const tutorialData = req.body;

      if (!tutorialData.name) {
        return res.status(400).send({
          success: false,
          message: "Tutor name is required",
        });
      }
      const result = await tutorialCollection.insertOne(
        tutorialData
      );

      res.send(result);
    });

app.get("/mybookings",
  tokenVerificationMiddleware,
  async (req, res) => {

    const email = req.query.email;

    if (email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const result = await bookingCollection
      .find({ userEmail: email })
      .toArray();

    res.json(result);
});

    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB connected");
  } catch (error) {
    console.log(error);
  }
}

run();

app.get("/", (req, res) => {
  res.send("Server running");
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
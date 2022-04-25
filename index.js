const express = require("express");
const cors = require("cors");
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


const app = express()

// middlware
app.use(cors())
app.use(express.json())

function varifyJWT(req, res, next) {
    const authHeader = req.authHeader.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorize access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECREAT, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        console.log('decoded', decoded);
        req.decoded = decoded
        next()
    })
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dci89.mongodb.net/myFirstDatabase?retryWrites=true`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()
        const serviceCollection = client.db('geniusCar').collection('service');
        const orderCollection = client.db('geniusCar').collection('order')

        // AUTH
        app.post('/login', (req, res) => {
            const user = req.body
            const accesstoken = jwt.sign(user, process.env.ACCESS_TOKEN_SECREAT, {
                expiresIn: '1d'

            });
            res.send(accesstoken)

        })

        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })

        // POST
        app.post('/service', async (ruq, res) => {
            const newService = ruq.body
            const result = await serviceCollection.insertOne(newService)
            res.send(result)

        })


        // delete
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id;
            console.log('hello', id);
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            res.send(result)

        })


        // order Collection api

        app.get('/order', varifyJWT, async (req, res) => {
            const decodedemail = req.decoded.email
            const email = req.query
            if (email === decodedemail) {
                const query = { email: email }
                const cursor = orderCollection.find(query)
                const orders = await cursor.toArray()
                res.send(orders)
            }
            else {
                res.status(403).send({ message: 'firbidden access' })
            }
        })



        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)

        })




    } finally {

    }
}


run().catch(console.dir())







app.get('/', (req, res) => {
    res.send('Runing Genius Car Service')
})

app.listen(port, () => {
    console.log('successfully run node project', port);
})


const express = require("express")
const mongoose = require("mongoose")
const cors = require('cors')
const Jwt = require('jsonwebtoken');

const jwtkey = "e-comm"

require('./db/config')
const user = require('./db/user'); //users collection
const product = require('./db/product')

const app = express();

app.use(express.json());
app.use(cors())

//   users collection
//Sign Up
app.post("/register", async (req, resp) => {
    const data = new user(req.body);
    let result = await data.save();
    result = result.toObject();      //delete password from api
    delete result.password;
    // resp.send(result)

    // jwt token start
    Jwt.sign({ result }, jwtkey, { expiresIn: "2h" }, (err, token) => {
        resp.send({ result, auth: token });
        if (err) {
            resp.send({ result: "something went wrong" })
        }
    })
    // jwt token end
});
// login + jwt
app.post('/login', async (req, resp) => {
    if (req.body.loginId && req.body.password) {
        const data = await user.findOne(req.body).select("-password")  //password remove kra sequirity purpose
        // resp.send(data);

        if (data) {
            // jwt token start
            Jwt.sign({ data }, jwtkey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "something went wrong" })
                }
                resp.send({ data, auth: token });
            })
            // jwt token end
        } else {
            resp.send({ "result": "No user found" });
        }
    } else {
        resp.send({ "result": "No user found" });
    }
})

//   products collection
//    Add product
app.post('/add-product',varifyToken, async (req, resp) => {
    let data = new product(req.body);
    let result = await data.save();
    resp.send(result)
})
// product- list
app.get('/productlist',varifyToken, async (req, resp) => {
    const data = await product.find();
    if (product.length > 0) {
        resp.send(data);
    } else {
        resp.send({ result: "no data found" });
    }
})
// delete product
app.delete("/product/:id", varifyToken, async (req, resp) => {
    const data = await product.deleteOne({ _id: req.params.id })
    resp.send(data)
})
// Prifill update product
app.get("/product/:id", varifyToken, async (req, resp) => {
    const data = await product.findOne({ _id: req.params.id });
    if (data) {
        resp.send(data)
    } else {
        resp.send({ result: "No record found" })
    }
})
// update api
app.put("/product/:id",varifyToken, async (req, resp) => {
    let data = await product.updateOne({ _id: req.params.id }, { $set: req.body })
    resp.send(data)
})
//  Search api
app.get("/search/:key", varifyToken, async (req, resp) => {
    let data = await product.find({
        $or: [
            { name: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { company: { $regex: req.params.key } }
        ]
    })
    resp.send(data)
})

//  middleware function for token
function varifyToken(req, resp, next) {
    let token = req.headers['authorization']

    if (token) {
        token = token.split(' ')[1];
        // console.log("Midleware working : ", token)
        Jwt.verify(token, jwtkey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "Please provide valid token" })
            } else {
                next()
            }
        })
    } else {
        resp.status(403).send({ result: "Please add token with headers" })
    }

}
app.listen(5000, () => {
    console.log("run on port 5000")
})
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
//import all the packages
const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

require("dotenv").config();

//create server
const app = express();

//use middlewares
app.use(cors());
app.use(bodyParser.json());

//database url
const dbURL = process.env.mongoURL;

//connect to database
mongodb.MongoClient.connect(dbURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateindex: true,
    useFindAndModify: true
}, (err, client) => {
    //if error occur in connecting to database
    if (err) {
        return console.log(err);
    }
    console.log("Connected to Database");
    const newDB = client.db("ToDoAppDB");

    //api creation here

    //1 signup api
    app.post("/signup", (request, response) => {
        console.log(request.body);
        const { name, phoneNumber, email, password } = request.body;
        console.log(name, phoneNumber, email, password);

        //check if user already exist or not
        let existingUser = newDB.collection("user").find({ email: email }).toArray();
        existingUser.then((User) => {
            console.log("user=", User);
            console.log("user length=", User.length);

            //if user already exist 
            if (User.length > 0) {
                return response.status(401).json("User Already Exist, please login instead")
            }
            //user not exist
            else if (User.length === 0) {
                let createdUser = newDB.collection("user").insertOne({
                    name: name,
                    phoneNumber: phoneNumber,
                    email: email,
                    password: password
                });
                createdUser.then((UserCreated) => {
                    console.log("userCreated=", UserCreated.ops);
                    return response.status(200).json(UserCreated.ops);
                })

                let transporter = nodemailer.createTransport({
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    requireTLS: true,
                    auth: {
                        user: process.env.email,
                        pass: process.env.password
                    }
                });
                let mailOptions = {
                    from: 'jadonaditya8077@gmail.com',
                    to: email,
                    subject: 'Thanks for Signup',
                    text: `Hello ${name},
                    Welcome to ToDo Application`
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error.message);
                    }
                    console.log('success');
                });

            }
        })
    });

    // login API
    app.post("/login", (req, res) => {
        console.log("req body", req.body);
        const { email, password } = req.body;


        // check if user exist or not
        let existingUser = newDB.collection("user").find({ email: email }).toArray();
        existingUser.then((User) => {
            console.log("User = ", User);

            // if user not exist
            if (User.length === 0) {
                return res.status(401).json("USer does not exist please Signup instead");
            }
            // if user exist
            else if (User.length > 0) {
                // now check the password
                if (password === User[0].password) {
                    return res.status(200).json(User);
                }
                else if (password !== User[0].password) {
                    return res.status(401).json("Incorrect Password");
                }
            }
        })
    });
    // createtodo API
    app.post("/createtodo",(req,res)=>{
        console.log("request body: ",req.body);


        // create todo and and save into db

        let createtodo=newDB.collection("ToDo").insertOne(req.body);
        createtodo.then((createtodo)=>{
            res.status(200).json(createtodo.ops);
        })
    });
    // // gettodo API
    app.get("/getAllToDo/:userId",(req, res)=>{
        console.log(req.params.userId);

        // get all todo
        let allToDo=newDB.collection("ToDo").find({userId:req.params.userId}).toArray();
        allToDo.then((todo)=>{
            console.log(todo);
            res.status(200).json(todo);
        })
    });
    // delete todo api
    app.delete("/deletetodo/:userId/:todoId",(req,res)=>{
        

        //delete todo logic
        let deleteTodo=newDB.collection("ToDo").deleteOne({_id:new mongodb.ObjectId(req.params.todoId)});
        deleteTodo.then((todo)=>{
            console.log("todo delete=",todo);

            let allToDo=newDB.collection("ToDo").find({userId:req.params.userId}).toArray();
            allToDo.then((todo)=>{
            res.status(200).json(todo);
            })
        })
    });
    // update todo API
    app.patch("/updateTodo",(req,res)=>{
        console.log("req.body=",req.body);


        let updateTodo=newdb.collection("ToDo").findOneAndUpdate({_id:new mongodb.ObjectID(req.body.todoId)},
        {
            $set:{
                title:req.body.title,
                description:req.body.description,
                deadline:req.body.deadline
            }
        },{new:true,runValidators:true,retuenOriginal:false}
        )
    })
    
})

app.listen(8081, () => {
    console.log("Server started");
})
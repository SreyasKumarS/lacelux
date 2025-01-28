const express=require('express')
const session=require('express-session')
const flash = require('express-flash');
const app=express()
const {v4:uuid4}=require('uuid')
const methodOverride = require("method-override");
require('dotenv').config()
const mongoose=require('mongoose')
const path=require('path')
const userAuthRoute=require('./routes/userRouter')
const adminAuthRoute=require('./routes/adminRouter')





//setup mongodb connection

const db = mongoose.connect(process.env.DB_URL);
db.then(() => {
  console.log('database connected');
})
.catch((err) => { // Include 'err' parameter here
  console.log('error connecting to mongodb', err);
});



//setup express middleware

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(methodOverride("_method"));

//setup session

app.use(session({
  secret:uuid4(),
  resave:false,
  saveUninitialized:true
}))
// Flash messages middleware
app.use(flash());


//setup view engine and static file serving

app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'views'));
app.use('/public',express.static(path.join(__dirname,'/public')))


//require routes

app.use('/',userAuthRoute)
app.use('/',adminAuthRoute)


//start server

const port=process.env.port||3000
app.listen(port,()=>{
  console.log(`server running on http://localhost:${port}`);
})

//404 error

app.get('*',(req, res)=>{
  res.status(404).render('404.ejs');
});
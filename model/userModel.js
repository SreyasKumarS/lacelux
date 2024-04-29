const mongoose=require('mongoose')

const userschema= new mongoose.Schema({
name:{
  type:String,
  required:true
},
email:{
  type:String,
  required:true
},
isVerified:{
  type:String,
  required:true
},
mobile:{
  type:Number, 
},
password:{
  type:String,
  required:true
},
address:[
{
  name:{type:String},
  mobile:{type:Number},
  pincode:{type:Number},
  houseName:{type:String},
  cityOrTown:{type:String},
  district:{type:String},
  state:{type:String},
  country:{type:String}
}],
isActive: {
  type: Boolean,
  default: true,
},

referralCode: {
  type: String,
  unique: true
}

})

const User= mongoose.model("User",userschema)

module.exports= User;
const mongoose=require('mongoose')

const registerSchema=new mongoose.Schema({
    firstName:{type:String, required:true},
    lastName:{type:String, required:true},
    email:{type:String,required:true,lowercase:true,unique:true,trim:true},
    password:{type:String,required:true},
    phone:{type:String,default:''},
    role:{type:String,default:'user'}
})
module.exports=mongoose.model('register',registerSchema)
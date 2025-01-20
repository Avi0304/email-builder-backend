const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    content:{
        type: String,
        required: true
    },
    footer:{
        type: String,
        required: true
    },
    imageURL: {
        type: [String], 
        default: [] 
    },
    logo: {
        type: String,
        default: ""
    },
    titleStyle: {
        type: Object,
        default: {}
    },
    contentStyle: {
        type: Object,
        default: {}
    },
    footerStyle: { 
        type: Object, 
        default: {} 
    }, 
},{timestamps: true})

module.exports = mongoose.model("EmailTemplate",emailTemplateSchema);
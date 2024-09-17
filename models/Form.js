const mongoose = require('mongoose');

// Define a schema for each file entry
const fileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  key: { type: String, required: true },
  mimetype: { type: String, required: true }
}, { _id: false });

// Define the schema for each field in the page
const fieldSchema = new mongoose.Schema({
  key: { type: String, required: true }, 
  value: mongoose.Schema.Types.Mixed
}, { _id: false });

// Define the schema for each page
const pageSchema = new mongoose.Schema({
  pageId: { type: String, required: true },
  pageType: { type: String, required: true },  
  fields: [fieldSchema]
}, { _id: false });

// Define the form schema
const formSchema = new mongoose.Schema({
  formId: { type: String, required: true, default: () => new mongoose.Types.ObjectId().toString() },
  formName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Associate form with user
  pages: [pageSchema],
  
  // Use a Map to store files, where the key can be the file name or some identifier
  files: { 
    type: Map, 
    of: fileSchema // Each value in the Map must conform to the fileSchema
  },
  metadata: { 
    description: String, 
    tags: [String] 
  } 
}, { timestamps: true });

module.exports = mongoose.model('Form', formSchema);

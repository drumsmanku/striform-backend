const mongoose = require('mongoose');

// const fieldSchema = new mongoose.Schema({
//   type: { type: String, },
//   label: { type: String, },
//   required: { type: Boolean, default: false },
// }, { _id: false, strict: false });

const pageSchema = new mongoose.Schema({
  pageId: { type: String, required: true },
  pageType: { type: String },
  pageName: { type: String },
  fields: [],
  componentsMetaData: []
}, { _id: false });

const formSchema = new mongoose.Schema({
  formId: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  design:{},
  formName: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pages: [pageSchema],
  metadata: {
    description: String,
    tags: [String]
  }
}, { timestamps: true });

module.exports = mongoose.model('Form', formSchema);
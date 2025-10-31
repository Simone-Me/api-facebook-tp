import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Titre: { type: String, required: true },
  Description: String,
  Evenement: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  Createur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'surveys',
  minimize: false,
  versionKey: false
}).set('toJSON', {
  transform: (doc, ret) => {
    const retUpdated = ret;
    retUpdated.id = ret._id;

    delete retUpdated._id;

    return retUpdated;
  }
});

export default Schema;

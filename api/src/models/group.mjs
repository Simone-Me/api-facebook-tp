import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Nom: { type: String, required: true },
  Description: { type: String, required: true },
  Icône: { type: String, required: true },
  Photo_de_couverture: { type: String, required: true },
  Type: { type: String, enum: ['public', 'privé', 'secret'], required: true },
  Autoriser_publication: { type: Boolean, default: false },
  Autoriser_evenements: { type: Boolean, default: true },
  Organisateurs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  Membres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  Evenements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  Messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'groups',
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

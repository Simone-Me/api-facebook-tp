import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Contenu: { type: String, required: true },
  Auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Groupe: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  Evenement: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  Parent_message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'messages',
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

Schema.pre('save', function validateMessageTarget(next) {
  if (this.Groupe && this.Evenement) {
    next(new Error('Un message ne peut être lié qu\'à un groupe OU un événement, pas les deux'));
  } else if (!this.Groupe && !this.Evenement) {
    next(new Error('Un message doit être lié à un groupe ou un événement'));
  } else {
    next();
  }
});

export default Schema;

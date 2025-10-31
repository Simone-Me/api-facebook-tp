import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Nom: { type: String, required: true },
  Description: { type: String, required: true },
  Date_de_début: { type: Date, required: true },
  Date_de_fin: { type: Date, required: true },
  Lieu: { type: String, required: true },
  Photo_de_couverture: { type: String, required: true },
  Prive: { type: Boolean, default: false },
  Billetterie_active: { type: Boolean, default: false },
  Groupe: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  Organisateurs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  Membres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  Messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  Albums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
  Surveys: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Survey' }],
  Types_billets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TicketType' }],
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'events',
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

// Middleware: Rimuovi l'evento dal gruppo quando viene eliminato
// eslint-disable-next-line prefer-arrow-callback
Schema.post('findOneAndDelete', async function removeEventFromGroup(doc) {
  if (doc && doc.Groupe) {
    try {
      const Group = doc.db.model('Group');
      await Group.findByIdAndUpdate(
        doc.Groupe,
        { $pull: { Evenements: doc._id } }
      );
      console.log(`Event ${doc._id} successfully removed from group ${doc.Groupe}`);
    } catch (error) {
      console.error(`[ERROR] Failed to remove event from group: ${error.message}`);
    }
  }
});

export default Schema;

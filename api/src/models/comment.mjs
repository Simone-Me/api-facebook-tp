import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Contenu: { type: String, required: true },
  Auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Photo: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', required: true },
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'comments',
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

// Middleware: Aggiungi il commento alla foto dopo il salvataggio
// eslint-disable-next-line prefer-arrow-callback
Schema.post('save', async function addCommentToPhoto(doc) {
  if (doc.Photo) {
    try {
      const Photo = this.db.model('Photo');
      await Photo.findByIdAndUpdate(
        doc.Photo,
        { $addToSet: { commentaires: doc._id } }
      );
      console.log(`Comment ${doc._id} successfully added to photo ${doc.Photo}`);
    } catch (error) {
      console.error(`[ERROR] Failed to add comment to photo: ${error.message}`);
    }
  }
});

// Middleware: Rimuovi il commento dalla foto quando viene eliminato
// eslint-disable-next-line prefer-arrow-callback
Schema.post('findOneAndDelete', async function removeCommentFromPhoto(doc) {
  if (doc && doc.Photo) {
    try {
      const Photo = doc.db.model('Photo');
      await Photo.findByIdAndUpdate(
        doc.Photo,
        { $pull: { commentaires: doc._id } }
      );
      console.log(`Comment ${doc._id} successfully removed from photo ${doc.Photo}`);
    } catch (error) {
      console.error(`[ERROR] Failed to remove comment from photo: ${error.message}`);
    }
  }
});

export default Schema;

import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: String,
  auteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', required: true },
  commentaires: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'photos',
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

// Middleware: Aggiungi la foto all'album dopo il salvataggio
// eslint-disable-next-line prefer-arrow-callback
Schema.post('save', async function addPhotoToAlbum(doc) {
  if (doc.album) {
    console.log(`Adding photo ${doc._id} to album ${doc.album}`);
    try {
      const Album = this.db.model('Album');
      await Album.findByIdAndUpdate(
        doc.album,
        { $addToSet: { photos: doc._id } }
      );
      console.log(`Photo ${doc._id} successfully added to album ${doc.album}`);
    } catch (error) {
      console.error(`[ERROR] Failed to add photo to album: ${error.message}`);
    }
  }
});

// Middleware: Rimuovi la foto dall'album quando viene eliminata
// eslint-disable-next-line prefer-arrow-callback
Schema.post('findOneAndDelete', async function removePhotoFromAlbum(doc) {
  if (doc && doc.album) {
    try {
      const Album = doc.db.model('Album');
      await Album.findByIdAndUpdate(
        doc.album,
        { $pull: { photos: doc._id } }
      );
      console.log(`Photo ${doc._id} successfully removed from album ${doc.album}`);
    } catch (error) {
      console.error(`[ERROR] Failed to remove photo from album: ${error.message}`);
    }
  }
});

export default Schema;

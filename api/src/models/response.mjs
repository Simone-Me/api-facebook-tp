import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  Question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  Participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Reponse_choisie_index: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'responses',
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

// Index composito: un utente può rispondere solo una volta per domanda
Schema.index({ Survey: 1, Question: 1, Participant: 1 }, { unique: true });

// Middleware: Incrementa i voti quando viene salvata una risposta
// eslint-disable-next-line prefer-arrow-callback
Schema.post('save', async function incrementVote(doc) {
  try {
    const Question = this.db.model('Question');
    await Question.findByIdAndUpdate(
      doc.Question,
      { $inc: { [`Reponses_possibles.${doc.Reponse_choisie_index}.votes`]: 1 } }
    );
    console.log(`Vote incremented for question ${doc.Question}, answer ${doc.Reponse_choisie_index}`);
  } catch (error) {
    console.error(`[ERROR] Failed to increment vote: ${error.message}`);
  }
});

export default Schema;

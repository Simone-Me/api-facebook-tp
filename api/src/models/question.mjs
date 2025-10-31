import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Texte: { type: String, required: true },
  Survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  Reponses_possibles: [{
    texte: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'questions',
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

// Middleware: Aggiungi la question al survey dopo il salvataggio
// eslint-disable-next-line prefer-arrow-callback
Schema.post('save', async function addQuestionToSurvey(doc) {
  if (doc.Survey) {
    try {
      const Survey = this.db.model('Survey');
      await Survey.findByIdAndUpdate(
        doc.Survey,
        { $addToSet: { Questions: doc._id } }
      );
      console.log(`Question ${doc._id} successfully added to survey ${doc.Survey}`);
    } catch (error) {
      console.error(`[ERROR] Failed to add question to survey: ${error.message}`);
    }
  }
});

// Middleware: Rimuovi la question dal survey quando viene eliminata
// eslint-disable-next-line prefer-arrow-callback
Schema.post('findOneAndDelete', async function removeQuestionFromSurvey(doc) {
  if (doc && doc.Survey) {
    try {
      const Survey = doc.db.model('Survey');
      await Survey.findByIdAndUpdate(
        doc.Survey,
        { $pull: { Questions: doc._id } }
      );
      console.log(`Question ${doc._id} successfully removed from survey ${doc.Survey}`);
    } catch (error) {
      console.error(`[ERROR] Failed to remove question from survey: ${error.message}`);
    }
  }
});

export default Schema;

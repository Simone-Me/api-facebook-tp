import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Nom: { type: String, required: true },
  Montant: { type: Number, required: true },
  Quantite_disponible: { type: Number, required: true },
  Quantite_vendue: { type: Number, default: 0 },
  Evenement: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  Createur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now }
}, {
  collection: 'ticketTypes',
  minimize: false,
  versionKey: false
}).set('toJSON', {
  transform: (doc, ret) => {
    const retUpdated = ret;
    retUpdated.id = ret._id;
    retUpdated.Quantite_restante = ret.Quantite_disponible - ret.Quantite_vendue;

    delete retUpdated._id;

    return retUpdated;
  }
});

export default Schema;

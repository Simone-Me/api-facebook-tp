import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  Type_billet: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  Evenement: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  Nom: { type: String, required: true },
  Prenom: { type: String, required: true },
  Email: { type: String, required: true },
  Adresse_complete: {
    rue: { type: String, required: true },
    ville: { type: String, required: true },
    code_postal: { type: String, required: true },
    pays: { type: String, required: true }
  },
  Date_achat: { type: Date, default: Date.now },
  Code_billet: { type: String, required: true, unique: true }
}, {
  collection: 'tickets',
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

Schema.index({ Evenement: 1, Email: 1 }, { unique: true });

// Middleware: Incrementa quantità venduta quando viene acquistato un biglietto
// eslint-disable-next-line prefer-arrow-callback
Schema.pre('save', async function checkAvailability(next) {
  try {
    const TicketType = this.db.model('TicketType');
    const ticketType = await TicketType.findById(this.Type_billet);

    if (!ticketType) {
      return next(new Error('Ticket type not found'));
    }

    if (ticketType.Quantite_vendue >= ticketType.Quantite_disponible) {
      return next(new Error('No tickets available'));
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

// Middleware: Incrementa il contatore di biglietti venduti
// eslint-disable-next-line prefer-arrow-callback
Schema.post('save', async function incrementSold(doc) {
  try {
    const TicketType = this.db.model('TicketType');
    await TicketType.findByIdAndUpdate(
      doc.Type_billet,
      { $inc: { Quantite_vendue: 1 } }
    );
    console.log(`Ticket sold for type ${doc.Type_billet}, total sold incremented`);
  } catch (error) {
    console.error(`[ERROR] Failed to increment sold tickets: ${error.message}`);
  }
});

// Middleware: Decrementa il contatore quando un biglietto viene eliminato
// eslint-disable-next-line prefer-arrow-callback
Schema.post('findOneAndDelete', async function decrementSold(doc) {
  if (doc && doc.Type_billet) {
    try {
      const TicketType = doc.db.model('TicketType');
      await TicketType.findByIdAndUpdate(
        doc.Type_billet,
        { $inc: { Quantite_vendue: -1 } }
      );
      console.log(`Ticket refunded for type ${doc.Type_billet}, total sold decremented`);
    } catch (error) {
      console.error(`[ERROR] Failed to decrement sold tickets: ${error.message}`);
    }
  }
});

export default Schema;

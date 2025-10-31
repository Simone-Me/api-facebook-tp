import EventModel from '../models/event.mjs';
import TicketModel from '../models/ticket.mjs';
import TicketTypeModel from '../models/ticketType.mjs';

const Tickets = class Tickets {
  constructor(app, connect) {
    this.app = app;
    this.TicketTypeModel = connect.model('TicketType', TicketTypeModel);
    this.TicketModel = connect.model('Ticket', TicketModel);
    this.EventModel = connect.model('Event', EventModel);

    this.run();
  }

  createTicketType() {
    this.app.post('/event/:eventId/ticket-type/', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const event = await this.EventModel.findById(req.params.eventId);

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Event not found'
          });
        }

        if (event.Prive) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only public events can have ticketing'
          });
        }

        if (!event.Organisateurs.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can create ticket types'
          });
        }

        const ticketTypeModel = new this.TicketTypeModel({
          ...req.body,
          Evenement: req.params.eventId,
          Createur: userId
        });

        const savedTicketType = await ticketTypeModel.save();

        await this.EventModel.findByIdAndUpdate(
          req.params.eventId,
          {
            $addToSet: { Types_billets: savedTicketType._id },
            Billetterie_active: true
          }
        );

        return res.status(201).json(savedTicketType);
      } catch (err) {
        console.error(`[ERROR] /event/:eventId/ticket-type/create -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  purchaseTicket() {
    this.app.post('/event/:eventId/ticket/purchase', async (req, res) => {
      try {
        const event = await this.EventModel.findById(req.params.eventId);

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Event not found'
          });
        }

        if (!event.Billetterie_active) {
          return res.status(403).json({
            code: 403,
            message: 'Ticketing not available for this event'
          });
        }

        const codeBillet = `TICKET-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        const ticketModel = new this.TicketModel({
          Type_billet: req.body.Type_billet,
          Evenement: req.params.eventId,
          Nom: req.body.Nom,
          Prenom: req.body.Prenom,
          Email: req.body.Email,
          Adresse_complete: req.body.Adresse_complete,
          Code_billet: codeBillet
        });

        const savedTicket = await ticketModel.save();
        return res.status(201).json(savedTicket);
      } catch (err) {
        console.error(`[ERROR] /event/:eventId/ticket/purchase -> ${err}`);

        if (err.code === 11000) {
          return res.status(409).json({
            code: 409,
            message: 'You have already purchased a ticket for this event'
          });
        }

        if (err.message === 'No tickets available') {
          return res.status(410).json({
            code: 410,
            message: 'Sold out - No tickets available'
          });
        }

        return res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  showEventTicketTypes() {
    this.app.get('/event/:eventId/ticket-types', (req, res) => {
      try {
        this.TicketTypeModel.find({ Evenement: req.params.eventId })
          .then((ticketTypes) => {
            res.status(200).json(ticketTypes || []);
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /event/:eventId/ticket-types -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showEventTickets() {
    this.app.get('/event/:eventId/tickets', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const event = await this.EventModel.findById(req.params.eventId);

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Event not found'
          });
        }

        if (!event.Organisateurs.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can view sold tickets'
          });
        }

        const tickets = await this.TicketModel.find({ Evenement: req.params.eventId })
          .populate('Type_billet');

        return res.status(200).json(tickets || []);
      } catch (err) {
        console.error(`[ERROR] /event/:eventId/tickets -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  verifyTicket() {
    this.app.get('/ticket/verify/:code', async (req, res) => {
      try {
        const ticket = await this.TicketModel.findOne({ Code_billet: req.params.code })
          .populate('Type_billet')
          .populate('Evenement');

        if (!ticket) {
          return res.status(404).json({
            code: 404,
            message: 'Ticket not found',
            valid: false
          });
        }

        return res.status(200).json({
          valid: true,
          ticket
        });
      } catch (err) {
        console.error(`[ERROR] /ticket/verify/:code -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  cancelTicket() {
    this.app.delete('/ticket/:id', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const ticket = await this.TicketModel.findById(req.params.id)
          .populate('Evenement');

        if (!ticket) {
          return res.status(404).json({
            code: 404,
            message: 'Ticket not found'
          });
        }

        if (!ticket.Evenement.Organisateurs.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can cancel tickets'
          });
        }

        await this.TicketModel.findByIdAndDelete(req.params.id);
        return res.status(200).json({
          message: 'Ticket cancelled successfully',
          ticket
        });
      } catch (err) {
        console.error(`[ERROR] /ticket/:id DELETE -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  updateTicketType() {
    this.app.put('/ticket-type/:id', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const ticketType = await this.TicketTypeModel.findById(req.params.id)
          .populate('Evenement');

        if (!ticketType) {
          return res.status(404).json({
            code: 404,
            message: 'Ticket type not found'
          });
        }

        if (!ticketType.Evenement.Organisateurs.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can update ticket types'
          });
        }

        const updatedTicketType = await this.TicketTypeModel.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );

        return res.status(200).json(updatedTicketType);
      } catch (err) {
        console.error(`[ERROR] /ticket-type/:id PUT -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  run() {
    this.createTicketType();
    this.purchaseTicket();
    this.showEventTicketTypes();
    this.showEventTickets();
    this.verifyTicket();
    this.cancelTicket();
    this.updateTicketType();
  }
};

export default Tickets;

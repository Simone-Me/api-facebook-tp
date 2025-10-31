import EventModel from '../models/event.mjs';
import GroupModel from '../models/group.mjs';

const Events = class Events {
  constructor(app, connect) {
    this.app = app;
    this.EventModel = connect.model('Event', EventModel);
    this.GroupModel = connect.model('Group', GroupModel);

    this.run();
  }

  deleteById() {
    this.app.delete('/event/:id', async (req, res) => {
      try {
        const userId = req.headers['user-id'];
        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const event = await this.EventModel.findById(req.params.id);
        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Event not found'
          });
        }

        const isOrganizer = event.Organisateurs.some(
          (org) => org.toString() === userId
        );

        if (!isOrganizer) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can delete events'
          });
        }

        await this.EventModel.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: 'Event deleted successfully' });
      } catch (err) {
        console.error(`[ERROR] events/delete/:id -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Internal Server error'
        });
      }
    });
  }

  showById() {
    this.app.get('/event/:id', (req, res) => {
      try {
        this.EventModel.findById(req.params.id)
          .populate('Organisateurs')
          .populate('Membres')
          .then((event) => {
            res.status(200).json(event || {});
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /event/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  create() {
    this.app.post('/event/', async (req, res) => {
      try {
        const eventModel = new this.EventModel(req.body);

        // eventModel.Organisateurs.push(userId);
        // eventModel.Membres.push(userId);

        if (req.body.Groupe) {
          const group = await this.GroupModel.findById(req.body.Groupe);

          if (!group) {
            return res.status(404).json({
              code: 404,
              message: 'Group not found'
            });
          }

          eventModel.Membres = [...new Set([
            ...(eventModel.Membres || []),
            ...group.Membres
          ])];

          console.log(`Auto-inviting ${group.Membres.length} members from group ${group.Nom}`);
        }

        const savedEvent = await eventModel.save();

        if (req.body.Groupe) {
          await this.GroupModel.findByIdAndUpdate(
            req.body.Groupe,
            { $addToSet: { Evenements: savedEvent._id } }
          );
        }

        return res.status(201).json(savedEvent);
      } catch (err) {
        console.error(`[ERROR] /event/create -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  showAll() {
    this.app.get('/events/', (req, res) => {
      try {
        this.EventModel.find({})
          .populate('Organisateurs')
          .populate('Membres')
          .then((events) => {
            res.status(200).json(events || []);
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /events/ -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  update() {
    this.app.put('/event/:id', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const event = await this.EventModel.findById(req.params.id);

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Event not found'
          });
        }

        if (!event.Organisateurs.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can update this event'
          });
        }

        const updatedEvent = await this.EventModel.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );
        return res.status(200).json(updatedEvent);
      } catch (err) {
        console.error(`[ERROR] /event/:id PUT -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  run() {
    this.create();
    this.showById();
    this.deleteById();
    this.showAll();
    this.update();
  }
};

export default Events;

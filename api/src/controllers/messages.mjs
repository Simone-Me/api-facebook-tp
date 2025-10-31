import MessageModel from '../models/message.mjs';

const Messages = class Messages {
  constructor(app, connect) {
    this.app = app;
    this.MessageModel = connect.model('Message', MessageModel);

    this.run();
  }

  deleteById() {
    this.app.delete('/message/:id', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const message = await this.MessageModel.findById(req.params.id);

        if (!message) {
          return res.status(404).json({
            code: 404,
            message: 'Message not found'
          });
        }

        if (message.Auteur.toString() !== userId) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only the author can delete this message'
          });
        }

        await this.MessageModel.findByIdAndDelete(req.params.id);
        return res.status(200).json(message);
      } catch (err) {
        console.error(`[ERROR] /message/:id DELETE -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showById() {
    this.app.get('/message/:id', (req, res) => {
      try {
        this.MessageModel.findById(req.params.id)
          .populate('Auteur')
          .populate('Parent_message')
          .then((message) => {
            res.status(200).json(message || {});
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /message/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  createGroupMessage() {
    this.app.post('/group/:groupId/message/', async (req, res) => {
      try {
        const messageModel = new this.MessageModel({
          ...req.body,
          Groupe: req.params.groupId,
          Evenement: null
        });

        const savedMessage = await messageModel.save();
        res.status(201).json(savedMessage);
      } catch (err) {
        console.error(`[ERROR] /group/:groupId/message/create -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  createEventMessage() {
    this.app.post('/event/:eventId/message/', async (req, res) => {
      try {
        const messageModel = new this.MessageModel({
          ...req.body,
          Evenement: req.params.eventId,
          Groupe: null
        });

        const savedMessage = await messageModel.save();
        res.status(201).json(savedMessage);
      } catch (err) {
        console.error(`[ERROR] /event/:eventId/message/create -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  showGroupMessages() {
    this.app.get('/group/:groupId/messages', (req, res) => {
      try {
        this.MessageModel.find({ Groupe: req.params.groupId })
          .populate('Auteur')
          .populate('Parent_message')
          .sort({ created_at: 1 })
          .then((messages) => {
            res.status(200).json(messages || []);
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /group/:groupId/messages -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showEventMessages() {
    this.app.get('/event/:eventId/messages', (req, res) => {
      try {
        this.MessageModel.find({ Evenement: req.params.eventId })
          .populate('Auteur')
          .populate('Parent_message')
          .sort({ created_at: 1 })
          .then((messages) => {
            res.status(200).json(messages || []);
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /event/:eventId/messages -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  replyToMessage() {
    this.app.post('/message/:messageId/reply', async (req, res) => {
      try {
        const parentMessage = await this.MessageModel.findById(req.params.messageId);

        if (!parentMessage) {
          return res.status(404).json({
            code: 404,
            message: 'Parent message not found'
          });
        }

        const replyModel = new this.MessageModel({
          ...req.body,
          Parent_message: req.params.messageId,
          Groupe: parentMessage.Groupe,
          Evenement: parentMessage.Evenement
        });

        const savedReply = await replyModel.save();
        return res.status(201).json(savedReply);
      } catch (err) {
        console.error(`[ERROR] /message/:messageId/reply -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  showReplies() {
    this.app.get('/message/:messageId/replies', (req, res) => {
      try {
        this.MessageModel.find({ Parent_message: req.params.messageId })
          .populate('Auteur')
          .sort({ created_at: 1 })
          .then((replies) => {
            res.status(200).json(replies || []);
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /message/:messageId/replies -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  run() {
    this.createGroupMessage();
    this.createEventMessage();
    this.replyToMessage();
    this.showById();
    this.showGroupMessages();
    this.showEventMessages();
    this.showReplies();
    this.deleteById();
  }
};

export default Messages;

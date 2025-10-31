import GroupModel from '../models/group.mjs';

const Groups = class Groups {
  constructor(app, connect) {
    this.app = app;
    this.GroupModel = connect.model('Group', GroupModel);

    this.run();
  }

  deleteById() {
    this.app.delete('/group/:id', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const group = await this.GroupModel.findById(req.params.id);

        if (!group) {
          return res.status(404).json({
            code: 404,
            message: 'Group not found'
          });
        }

        if (!group.Organisateurs.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can delete this group'
          });
        }

        await this.GroupModel.findByIdAndDelete(req.params.id);
        return res.status(200).json(group);
      } catch (err) {
        console.error(`[ERROR] /group/:id DELETE -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showById() {
    this.app.get('/group/:id', (req, res) => {
      try {
        this.GroupModel.findById(req.params.id)
          .populate('Organisateurs')
          .populate('Membres')
          .then((group) => {
            res.status(200).json(group || {});
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /group/:id -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  create() {
    this.app.post('/group/', (req, res) => {
      try {
        const groupModel = new this.GroupModel(req.body);

        groupModel.save().then((group) => {
          res.status(201).json(group || {});
        })
          .catch((error) => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error',
              error: error.message
            });
          });
      } catch (err) {
        console.error(`[ERROR] /group/create -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showAll() {
    this.app.get('/groups/', (req, res) => {
      try {
        this.GroupModel.find({})
          .populate('Organisateurs')
          .populate('Membres')
          .then((groups) => {
            res.status(200).json(groups || []);
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /groups/ -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  update() {
    this.app.put('/group/:id', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const group = await this.GroupModel.findById(req.params.id);

        if (!group) {
          return res.status(404).json({
            code: 404,
            message: 'Group not found'
          });
        }

        if (!group.Organisateurs.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can update this group'
          });
        }

        const updatedGroup = await this.GroupModel.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );
        return res.status(200).json(updatedGroup);
      } catch (err) {
        console.error(`[ERROR] /group/:id PUT -> ${err}`);

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

export default Groups;

import CommentModel from '../models/comment.mjs';
import PhotoModel from '../models/photo.mjs';

const Photos = class Photos {
  constructor(app, connect) {
    this.app = app;
    this.PhotoModel = connect.model('Photo', PhotoModel);
    this.CommentModel = connect.model('Comment', CommentModel);

    this.run();
  }

  deleteById() {
    this.app.delete('/album/:idAlbum/photo/:idPhoto', (req, res) => {
      try {
        this.PhotoModel.findByIdAndDelete(req.params.idPhoto).then((photo) => {
          res.status(200).json(photo || {});
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] /album/:idAlbum/photo/:idPhoto -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showById() {
    this.app.get('/album/:idAlbum/photo/:idPhoto', (req, res) => {
      try {
        this.PhotoModel.findById(req.params.idPhoto).then((photo) => {
          res.status(200).json(photo || {});
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] /album/:idAlbum/photo/:idPhoto -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  create() {
    this.app.post('/album/:idAlbum/photo/', (req, res) => {
      try {
        const photoModel = new this.PhotoModel(req.body);
        photoModel.album = req.params.idAlbum;

        photoModel.save().then((photo) => {
          res.status(201).json(photo || {});
        }).catch((error) => {
          console.error(`[ERROR] album/idAlbum/photos/create -> ${error}`);
          res.status(500).json({
            code: 500,
            message: 'Internal Server error',
            error: error.message
          });
        });
      } catch (err) {
        console.error(`[ERROR] album/idAlbum/photos/create -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showAll() {
    this.app.get('/album/:idAlbum/photos', (req, res) => {
      try {
        this.PhotoModel.find({ album: req.params.idAlbum }).then((photos) => {
          res.status(200).json(photos || []);
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] /album/:idAlbum/photos -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  update() {
    this.app.put('/album/:idAlbum/photo/:idPhoto', (req, res) => {
      try {
        this.PhotoModel.findByIdAndUpdate(
          req.params.idPhoto,
          req.body,
          { new: true }
        ).then((photo) => {
          res.status(200).json(photo || {});
        }).catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Internal Server error'
          });
        });
      } catch (err) {
        console.error(`[ERROR] /album/:idAlbum/photo/:idPhoto -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  createComment() {
    this.app.post('/photos/:idPhoto/comments', async (req, res) => {
      try {
        const photo = await this.PhotoModel.findById(req.params.idPhoto);
        if (!photo) {
          return res.status(404).json({
            code: 404,
            message: 'Photo not found'
          });
        }

        const comment = new this.CommentModel({
          ...req.body,
          Photo: req.params.idPhoto
        });

        const savedComment = await comment.save();
        return res.status(201).json(savedComment);
      } catch (err) {
        console.error(`[ERROR] /photos/:idPhoto/comments -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Internal Server error',
          error: err.message
        });
      }
    });
  }

  getComments() {
    this.app.get('/photos/:idPhoto/comments', async (req, res) => {
      try {
        const comments = await this.CommentModel.find({ Photo: req.params.idPhoto })
          .populate('Auteur', 'Username Email');
        res.status(200).json(comments);
      } catch (err) {
        console.error(`[ERROR] /photos/:idPhoto/comments -> ${err}`);
        res.status(500).json({
          code: 500,
          message: 'Internal Server error'
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
    this.createComment();
    this.getComments();
  }
};

export default Photos;

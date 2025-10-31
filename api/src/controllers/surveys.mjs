import EventModel from '../models/event.mjs';
import QuestionModel from '../models/question.mjs';
import ResponseModel from '../models/response.mjs';
import SurveyModel from '../models/survey.mjs';

const Surveys = class Surveys {
  constructor(app, connect) {
    this.app = app;
    this.SurveyModel = connect.model('Survey', SurveyModel);
    this.QuestionModel = connect.model('Question', QuestionModel);
    this.ResponseModel = connect.model('Response', ResponseModel);
    this.EventModel = connect.model('Event', EventModel);

    this.run();
  }

  createSurvey() {
    this.app.post('/event/:eventId/survey/', async (req, res) => {
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
            message: 'Forbidden - Only organizers can create surveys'
          });
        }

        const surveyModel = new this.SurveyModel({
          ...req.body,
          Evenement: req.params.eventId,
          Createur: userId
        });

        const savedSurvey = await surveyModel.save();

        await this.EventModel.findByIdAndUpdate(
          req.params.eventId,
          { $addToSet: { Surveys: savedSurvey._id } }
        );

        return res.status(201).json(savedSurvey);
      } catch (err) {
        console.error(`[ERROR] /event/:eventId/survey/create -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  createQuestion() {
    this.app.post('/survey/:surveyId/question/', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const survey = await this.SurveyModel.findById(req.params.surveyId)
          .populate('Evenement');

        if (!survey) {
          return res.status(404).json({
            code: 404,
            message: 'Survey not found'
          });
        }

        if (!survey.Evenement.Organisateurs.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only organizers can add questions'
          });
        }

        const questionModel = new this.QuestionModel({
          ...req.body,
          Survey: req.params.surveyId
        });

        const savedQuestion = await questionModel.save();
        return res.status(201).json(savedQuestion);
      } catch (err) {
        console.error(`[ERROR] /survey/:surveyId/question/create -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  submitResponse() {
    this.app.post('/survey/:surveyId/response/', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const survey = await this.SurveyModel.findById(req.params.surveyId)
          .populate('Evenement');

        if (!survey) {
          return res.status(404).json({
            code: 404,
            message: 'Survey not found'
          });
        }

        if (!survey.Evenement.Membres.includes(userId)) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only event participants can respond to surveys'
          });
        }

        const { responses } = req.body;
        const savedResponses = [];
        const savePromises = responses.map(async (resp) => {
          const responseModel = new this.ResponseModel({
            Survey: req.params.surveyId,
            Question: resp.questionId,
            Participant: userId,
            Reponse_choisie_index: resp.answerIndex
          });

          try {
            return await responseModel.save();
          } catch (error) {
            if (error.code === 11000) {
              console.log(`User ${userId} already answered question ${resp.questionId}`);
              return null;
            }
            throw error;
          }
        });

        const results = await Promise.all(savePromises);
        savedResponses.push(...results.filter((r) => r !== null));

        return res.status(201).json({
          message: 'Responses submitted successfully',
          responses: savedResponses
        });
      } catch (err) {
        console.error(`[ERROR] /survey/:surveyId/response/ -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request',
          error: err.message
        });
      }
    });
  }

  showEventSurveys() {
    this.app.get('/event/:eventId/surveys', (req, res) => {
      try {
        this.SurveyModel.find({ Evenement: req.params.eventId })
          .populate('Createur')
          .populate('Questions')
          .then((surveys) => {
            res.status(200).json(surveys || []);
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Internal Server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] /event/:eventId/surveys -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showSurveyWithResults() {
    this.app.get('/survey/:surveyId', async (req, res) => {
      try {
        const survey = await this.SurveyModel.findById(req.params.surveyId)
          .populate('Createur')
          .populate('Questions');

        if (!survey) {
          return res.status(404).json({
            code: 404,
            message: 'Survey not found'
          });
        }

        return res.status(200).json(survey);
      } catch (err) {
        console.error(`[ERROR] /survey/:surveyId -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  showUserResponses() {
    this.app.get('/survey/:surveyId/user/:userId/responses', async (req, res) => {
      try {
        const responses = await this.ResponseModel.find({
          Survey: req.params.surveyId,
          Participant: req.params.userId
        })
          .populate('Question')
          .populate('Participant');

        res.status(200).json(responses || []);
      } catch (err) {
        console.error(`[ERROR] /survey/:surveyId/user/:userId/responses -> ${err}`);

        res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  deleteSurvey() {
    this.app.delete('/survey/:id', async (req, res) => {
      try {
        const userId = req.headers['user-id'];

        if (!userId) {
          return res.status(401).json({
            code: 401,
            message: 'Unauthorized - User ID required in headers'
          });
        }

        const survey = await this.SurveyModel.findById(req.params.id);

        if (!survey) {
          return res.status(404).json({
            code: 404,
            message: 'Survey not found'
          });
        }

        if (survey.Createur.toString() !== userId) {
          return res.status(403).json({
            code: 403,
            message: 'Forbidden - Only the creator can delete this survey'
          });
        }

        await this.SurveyModel.findByIdAndDelete(req.params.id);

        await this.EventModel.findByIdAndUpdate(
          survey.Evenement,
          { $pull: { Surveys: survey._id } }
        );

        return res.status(200).json(survey);
      } catch (err) {
        console.error(`[ERROR] /survey/:id DELETE -> ${err}`);

        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  run() {
    this.createSurvey();
    this.createQuestion();
    this.submitResponse();
    this.showEventSurveys();
    this.showSurveyWithResults();
    this.showUserResponses();
    this.deleteSurvey();
  }
};

export default Surveys;

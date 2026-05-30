import express from 'express';
import cookieParser from 'cookie-parser';
import * as donorsController from '../modules/donors/donors.controller';
import * as requestsController from '../modules/requests/requests.controller';

export default function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Test helper to set req.user from header `x-test-role`
  app.use((req: any, _res, next) => {
    const role = req.header('x-test-role') || req.query['testRole'] || req.query['x-test-role'];
    const verified = (req.header('x-test-verified') === 'true') || req.query['testVerified'] === 'true' || req.query['testVerified'] === true;
    if (role) {
      // attach a minimal user object for controllers
      req.user = { role, isVerified: Boolean(verified) };
    }
    next();
  });

  // Mount minimal endpoints used in integration tests
  app.get('/api/v1/donors', (req, res, next) => donorsController.getAllDonors(req as any, res as any, next));
  app.get('/api/v1/donors/near', (req, res, next) => donorsController.getNearbyDonors(req as any, res as any, next));
  app.get('/api/v1/donors/search', (req, res, next) => donorsController.searchDonorsByCity(req as any, res as any, next));
  app.get('/api/v1/requests/:id/matches', (req, res, next) => requestsController.getMatchingDonors(req as any, res as any, next));

  return app;
}

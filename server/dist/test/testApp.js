"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createTestApp;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const donorsController = __importStar(require("../modules/donors/donors.controller"));
const requestsController = __importStar(require("../modules/requests/requests.controller"));
function createTestApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    // Test helper to set req.user from header `x-test-role`
    app.use((req, _res, next) => {
        const role = req.header('x-test-role') || req.query['testRole'] || req.query['x-test-role'];
        const verified = (req.header('x-test-verified') === 'true') || req.query['testVerified'] === 'true' || req.query['testVerified'] === true;
        if (role) {
            // attach a minimal user object for controllers
            req.user = { role, isVerified: Boolean(verified) };
        }
        next();
    });
    // Mount minimal endpoints used in integration tests
    app.get('/api/v1/donors', (req, res, next) => donorsController.getAllDonors(req, res, next));
    app.get('/api/v1/donors/near', (req, res, next) => donorsController.getNearbyDonors(req, res, next));
    app.get('/api/v1/donors/search', (req, res, next) => donorsController.searchDonorsByCity(req, res, next));
    app.get('/api/v1/requests/:id/matches', (req, res, next) => requestsController.getMatchingDonors(req, res, next));
    return app;
}

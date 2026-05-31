"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_geocoder_1 = __importDefault(require("node-geocoder"));
const options = {
    provider: 'openstreetmap',
    // Optional: apiKey, formatter
    formatter: null,
};
const geocoder = (0, node_geocoder_1.default)(options);
exports.default = geocoder;

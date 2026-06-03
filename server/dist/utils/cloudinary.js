"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const env_1 = require("../config/env");
cloudinary_1.v2.config({
    cloud_name: env_1.config.cloudinary.cloudName,
    api_key: env_1.config.cloudinary.apiKey,
    api_secret: env_1.config.cloudinary.apiSecret,
});
exports.storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (_req, file) => {
        const isPdf = file.mimetype === 'application/pdf';
        return {
            folder: 'hospital-docs',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
            public_id: `hospital-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
            resource_type: isPdf ? 'raw' : 'image', // Use 'raw' for PDFs to preserve them
        };
    },
});
exports.default = cloudinary_1.v2;

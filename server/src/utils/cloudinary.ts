import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { config } from '../config/env';

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
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

export default cloudinary;

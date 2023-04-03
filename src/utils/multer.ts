import express, { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

const cloudinary = require('cloudinary').v2;

import { CloudinaryStorage } from 'multer-storage-cloudinary';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'Echo',
            format: 'jpeg',
            // public_id: "some_unique_id",
        };
    },
});

const fileFilter = (
    request: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
): void => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
        return callback(new Error('File type not supported'));
    }

    callback(null, true);
};

const limits = {
  fileSize: 1000000
}

export const upload = multer({ storage, fileFilter, limits });

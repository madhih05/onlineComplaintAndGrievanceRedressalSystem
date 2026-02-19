import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage });

export const uploadImageToCloudinary = async (fileBuffer: Buffer, mimetype: string): Promise<string> => {
    const b64 = fileBuffer.toString('base64');
    const dataURI = `data:${mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'ibm_hackathon_complaints',
        resource_type: 'auto'
    });

    return result.secure_url; // Returns the clean https:// link
};
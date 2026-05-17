import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
});

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const result = await cloudinary.uploader.upload_stream(
      { folder: 'food-delivery' },
      (error, result) => {
        if (error) return res.status(500).json({ message: 'Upload failed', error });
        res.json({
          url: result!.secure_url,
          publicId: result!.public_id
        });
      }
    );

    result.end(req.file.buffer);
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const { publicId } = req.body;
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Image deleted' });
  } catch (err) {
    console.error('DELETE ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
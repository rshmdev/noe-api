import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';

export const storage = diskStorage({
  destination: (req, file, cb) => {
    const folderMap = {
      document_front: 'uploads/document_front',
      document_back: 'uploads/document_back',
      cnh_image: 'uploads/cnh_image',
      selfie: 'uploads/selfies',
    };

    const path = folderMap[file.fieldname] || 'uploads/others';
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }

    cb(null, path);
  },
  filename: (req: any, file, cb) => {
    const user = req.user; // JWT user
    const unique = `${user?.userId || 'anon'}_${Date.now()}`;
    const ext = extname(file.originalname);
    cb(null, `${unique}_${file.fieldname}${ext}`);
  },
});

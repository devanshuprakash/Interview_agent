import multer from "multer";

/**
 * MulterMiddleware — encapsulates the disk-storage + size-limit config
 * from the old middleware. Same 5MB cap, same `public/` target, same
 * `${timestamp}-${originalname}` filename pattern.
 */
export class MulterMiddleware {
  readonly upload: multer.Multer;

  constructor() {
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, "public");
      },
      filename: (_req, file, cb) => {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
      },
    });

    this.upload = multer({
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    });
  }
}

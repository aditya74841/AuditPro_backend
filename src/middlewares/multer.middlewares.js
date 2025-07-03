import multer from "multer";
import path from "path";
import os from "os";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir()); // Use system temp folder
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.originalname.split(" ")[0];
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

export const upload = multer({ storage });




// import multer from "multer";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // This storage needs public/images folder in the root directory
//     // Else it will throw an error saying cannot find path public/images
//     cb(null, "./public/images");
//   },
//   // Store file in a .png/.jpeg/.jpg format instead of binary
//   filename: function (req, file, cb) {
//     let fileExtension = "";
//     if (file.originalname.split(".").length > 1) {
//       fileExtension = file.originalname.substring(
//         file.originalname.lastIndexOf(".")
//       );
//     }
//     const filenameWithoutExtension = file.originalname
//       .toLowerCase()
//       .split(" ")
//       .join("-")
//       ?.split(".")[0];
//     cb(
//       null,
//       filenameWithoutExtension +
//         Date.now() +
//         Math.ceil(Math.random() * 1e5) + // avoid rare name conflict
//         fileExtension
//     );
//   },
// });

// export const upload = multer({
//   storage,
//   limits: {
//     fileSize: 1 * 1000 * 2000,
//   },
// });

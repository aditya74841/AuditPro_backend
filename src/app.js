// Import Swagger dependencies
// import swaggerUi from "swagger-ui-express";
// import  { swaggerDocs } from "./swagger.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
// Other imports
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import requestIp from "request-ip";
import { ApiError } from "./utils/ApiError.js";
import fs from "fs";

// Routes & Middlewares
import userRouter from "./routes/user.routes.js";
import masterRouter from "./routes/master.routes.js";
import companyRouter from "./routes/company.routes.js";
import storeRouter from "./routes/store.routes.js";
import demoRouter from "./routes/demoRequest.routes.js"
import { errorHandler } from "./middlewares/error.middlewares.js";
import { fileURLToPath } from "url";
import path from "path";

const app = express();
const httpServer = createServer(app);

// Global Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3000",
      "https://auditpro-backend-woxv.onrender.com"
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Swagger route
// swaggerDocs(app); // 🔥 Add this line

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const file = fs.readFileSync(path.resolve(__dirname, "./swagger.yaml"), "utf8");


// const swaggerDocument = YAML.parse(
//   file?.replace(
//     "- url: ${{server}}",
//     `- url: ${process.env.FREEAPI_HOST_URL || "http://localhost:8080"}/api/v1`
//   )
// );


const swaggerDocument = YAML.load(path.resolve(__dirname, "./swagger.yaml"));

// Optional dynamic base URL replace
swaggerDocument.servers = [
  {
    url: process.env.FREEAPI_HOST_URL || "http://localhost:8080/api/v1",
  },
];



// const swaggerDocument = YAML.load("./docs/swagger.yaml");
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// App Routes

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      docExpansion: "none", // keep all the sections collapsed by default
    },
    customSiteTitle: "FreeAPI docs",
  })
);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/master", masterRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/store", storeRouter);
app.use("/api/v1/demoRequest", demoRouter);

app.use("/", (req, res) => {
  res.status(200).send("<h1>Server is Running Successfullyy</h1>");
});

// Error handler
app.use(errorHandler);

export { httpServer };

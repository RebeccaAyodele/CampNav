import { config } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`CampNav backend listening on http://localhost:${config.port}`);
});

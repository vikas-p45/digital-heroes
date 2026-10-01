import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(`Digital Heroes API listening on :${config.port} (${config.nodeEnv}, payments: ${config.paymentProvider})`);
});

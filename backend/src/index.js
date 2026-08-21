import 'dotenv/config';
import app from './app.js';
import { seed } from './data/sampleData.js';

const PORT = process.env.PORT || 5000;

// Seed the in-memory sample data (hashes passwords) before accepting requests.
seed()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to seed sample data:', err);
    process.exit(1);
  });

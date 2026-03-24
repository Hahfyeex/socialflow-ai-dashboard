import dotenv from 'dotenv';
import app from './app';
import { initDirectories } from './utils/initDirectories';

dotenv.config();

const PORT = process.env.BACKEND_PORT || 3001;

// Initialize required directories
initDirectories().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 SocialFlow Backend is running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize directories:', error);
  process.exit(1);
});

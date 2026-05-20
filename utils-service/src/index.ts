import 'dotenv/config';
import app from './app';
const PORT = parseInt(process.env.PORT || '4006', 10);
app.listen(PORT, '0.0.0.0', () => console.log(`Utils service on port ${PORT}`));
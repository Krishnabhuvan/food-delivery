import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 4006;
app.listen(PORT, () => console.log(`Utils service on port ${PORT}`));
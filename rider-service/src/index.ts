import 'dotenv/config';
import app from './app';

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`Rider service on port ${PORT}`));
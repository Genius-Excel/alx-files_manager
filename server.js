import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/', routes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


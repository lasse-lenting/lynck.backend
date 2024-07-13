import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import connectDB from '@/db'; // Adjust the path as needed
import bodyParser from 'body-parser';
const app = express();
const port = process.env.PORT || 3000;

import { authenticate } from '@/middlewares/auth.middleware';
connectDB();


// Route imports
import shoppyRouter from '@/routes/shoppy.router';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Route definitions
app.get('/', (req: Request, res: Response) => {
    res.json(
        {
            "success": true,
            "message": "Welcome to the Lynck API",
        }
    )
});

app.use('/shoppy', authenticate, shoppyRouter);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
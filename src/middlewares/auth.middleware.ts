import { Request, Response, NextFunction } from 'express';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const apiKey = req.headers['api-key'];
    console.log(apiKey);
    // Assuming API_KEY is imported from your .env file
    if (apiKey && apiKey === process.env.API_KEY) {
        next(); // Proceed to the next middleware/route handler
    } else {
        res.status(401).send('Unauthorized'); // Or any other error handling
    }
}

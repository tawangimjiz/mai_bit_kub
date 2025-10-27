// middleware/cors.js
export default function initMiddleware(req, res) {
    return new Promise((resolve, reject) => {
        // Get the origin from the request
        const origin = req.headers.origin;
        
        // Allow requests from localhost on any port in development
        if (origin && origin.startsWith('http://localhost:')) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return resolve(true);
        }
        return resolve(false);
    });
}
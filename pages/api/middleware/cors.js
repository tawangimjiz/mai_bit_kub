// middleware/cors.js
export default function initMiddleware(req, res) {
    return new Promise((resolve, reject) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
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
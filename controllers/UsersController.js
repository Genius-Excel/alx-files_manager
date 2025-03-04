// controllers/UsersController.js
import crypto from 'crypto';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class UsersController {
    static async postNew(req, res) {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        const userCollection = dbClient.db.collection('users');
        const existingUser = await userCollection.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'Already exist' });
        }

        const sha1Password = crypto.createHash('sha1').update(password).digest('hex');
        const result = await userCollection.insertOne({ email, password: sha1Password });

        return res.status(201).json({ id: result.insertedId, email });
    }

    static async getMe(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const key = `auth_${token}`;
        const userId = await redisClient.get(key);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userCollection = dbClient.db.collection('users');
        const user = await userCollection.findOne({ _id: dbClient.client.ObjectId(userId) });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        return res.status(200).json({ id: user._id, email: user.email });
    }
}

export default UsersController;


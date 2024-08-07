import crypto from 'crypto';
import dbClient from '../utils/db.js';

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
}

export default UsersController;


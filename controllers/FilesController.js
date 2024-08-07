import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

class FilesController {
    static async postUpload(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const key = `auth_${token}`;
        const userId = await redisClient.get(key);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, type, parentId = 0, isPublic = false, data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        const validTypes = ['folder', 'file', 'image'];
        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if ((type === 'file' || type === 'image') && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        const filesCollection = dbClient.db.collection('files');
        if (parentId !== 0) {
            const parentFile = await filesCollection.findOne({ _id: dbClient.client.ObjectId(parentId) });
            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        const fileDocument = {
            userId: dbClient.client.ObjectId(userId),
            name,
            type,
            isPublic,
            parentId: parentId === 0 ? 0 : dbClient.client.ObjectId(parentId),
        };

        if (type === 'folder') {
            const result = await filesCollection.insertOne(fileDocument);
            return res.status(201).json({ id: result.insertedId, ...fileDocument });
        }

        const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(FOLDER_PATH)) {
            fs.mkdirSync(FOLDER_PATH, { recursive: true });
        }

        const localPath = path.join(FOLDER_PATH, uuidv4());
        fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

        fileDocument.localPath = localPath;

        const result = await filesCollection.insertOne(fileDocument);
        return res.status(201).json({ id: result.insertedId, ...fileDocument });
    }
}

export default FilesController;


import type { NextApiRequest, NextApiResponse } from 'next';

import { connectToDatabase } from '@/util/mongodb';
import { hash } from 'bcrypt';

const SALTROUNDS = 10;

const isUserExists = async (db, email) => {
  const user = await db.collection('users').find({ email: email }).toArray();

  if (user.length > 0) {
    return true;
  }

  return false;
};

const createUser = async (body, res) => {
  const { email, password, id, fullName } = body;

  try {
    const { db, client } = await connectToDatabase();

    if (!client) {
      res.status(500).json({ message: 'DB connection failed' });
      return;
    }

    const isExistingUser = await isUserExists(db, email);

    if (isExistingUser) {
      res.status(400).json({ message: 'Email is already registered' });
      return;
    }

    // Hash password asynchronously
    const hashedPassword = await hash(password, SALTROUNDS);

    // Insert user
    const result = await db.collection('users').insertOne({ _id: id, email, password: hashedPassword, fullName });

    if (result.acknowledged) {
      res.status(200).json({ message: 'success' });
    } else {
      res.status(500).json({ message: 'failed to create user' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'POST') {
    createUser(req.body, res);

    return;
  } else {
    // Handle any other HTTP method
  }
}

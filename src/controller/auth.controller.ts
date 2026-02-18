import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/users';

const jwtSecret = process.env.JWT_SECRET as string;

export const register = async (req: Request, res: Response) => {
    try {
        const { username, email, password, role, adminSecret } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === "admin" && adminSecret !== process.env.ADMIN_SECRET) {
            return res.status(403).json({ message: "Invalid admin secret" });
        }

        const newUser = new User({
            username,
            email,
            passwordHash: hashedPassword,
            role: role || "user"
        });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id, role: newUser.role }, jwtSecret, { expiresIn: '2h' });

        res.status(201).json({ message: 'User registered successfully', token, userId: newUser._id, role: newUser.role });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: '2h' });

        res.status(200).json({ message: 'Login successful', token, userId: user._id, role: user.role });
    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
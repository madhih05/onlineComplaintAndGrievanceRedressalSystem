import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import User from '../models/users.js';
import logger from '../utils/logger.js';

const getJwtSecret = () => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return jwtSecret;
};

export const register = async (req: Request, res: Response) => {
    try {
        const jwtSecret = getJwtSecret();
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

        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            jwtSecret,
            { expiresIn: '2h' }
        );

        logger.info(`User registered successfully: ${email}`);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            userId: newUser._id,
            role: newUser.role
        });
    } catch (error) {
        logger.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

};

export const login = async (req: Request, res: Response) => {
    try {
        const jwtSecret = getJwtSecret();
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            jwtSecret,
            { expiresIn: '2h' }
        );

        logger.info(`User logged in successfully: ${email}`);
        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user._id,
            role: user.role
        });
    }
    catch (error) {
        logger.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const autoLogin = async (req: Request, res: Response) => {
    try {
        const jwtSecret = getJwtSecret();
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, jwtSecret) as { userId: string; role: string };
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        logger.info(`Auto-login successful for user: ${user.email}`);
        res.status(200).json({
            message: 'Auto-login successful',
            userId: user._id,
            role: user.role
        });
    }
    catch (error) {
        logger.warn("Auto-login failed:", error);
        if (error instanceof Error && error.message === "JWT_SECRET is not configured") {
            return res.status(500).json({ message: "Server configuration error" });
        }
        res.status(401).json({ message: "Invalid token" });
    }
};
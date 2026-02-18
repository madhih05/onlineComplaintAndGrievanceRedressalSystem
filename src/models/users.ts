import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
    username: string;
    email: string;
    password: string;
    role: "user" | "admin" | "supportStaff";
    createdAt: Date;
}

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "supportStaff"], default: "user" },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
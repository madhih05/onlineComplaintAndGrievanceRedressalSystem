import mongoose from "mongoose";

export interface IComplaint extends mongoose.Document {
    title: string;
    description: string;
    status: "open" | "assigned" | "inProgress" | "resolved" | "closed";
    priority: "low" | "medium" | "high" | "critical";
    imageUrl?: string;
    createdBy: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    timeline?: {
        status: string;
        timestamp: Date;
        comment?: string;
        createdAt: Date;
        createdBy: mongoose.Types.ObjectId;
    }[];
    createdAt: Date;
    updatedAt?: Date;
    feedback?: {
        rating: number;
        comment: string;
        createdAt: Date;
        updatedAt: Date;
    }
}

const complaintSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ["open", "assigned", "inProgress", "resolved", "closed"],
        default: "open"
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    imageUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timeline: [
        {
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            comment: { type: String },
            createdAt: { type: Date, default: Date.now },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }
});

const Complaint = mongoose.model<IComplaint>("Complaint", complaintSchema);

export default Complaint;
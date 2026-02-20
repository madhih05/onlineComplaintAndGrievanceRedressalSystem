import { Response, Router } from "express";
import { uploadMiddleware, uploadImageToCloudinary } from "../helper/cloudinary.js";
import Complaint from "../models/complaints.js";
import logger from "../utils/logger.js";
import { analyzePriorityWithAI } from "../helper/ai.js";
import { verifyToken, authorizeRoles, AuthRequest } from "../middleware/auth.middleware.js";
import User from "../models/users.js";

const router = Router();

// Create a new complaint
router.post('/', verifyToken, uploadMiddleware.single('image'), async (req: AuthRequest, res: Response) => {
    try {
        const { title, description } = req.body;
        const userId = req.userId as string;

        let imageUrl: string | undefined;
        if (req.file) {
            imageUrl = await uploadImageToCloudinary(req.file.buffer, req.file.mimetype);
            logger.info(`Image uploaded to Cloudinary successfully for user ${userId}`);
        }

        const newComplaint = new Complaint({
            title,
            description,
            status: 'open',
            createdBy: userId,
            priority: await analyzePriorityWithAI(title, description),
            imageUrl,
            createdAt: new Date(),
        });

        const timelineEntry: any = {
            status: 'open',
            timestamp: new Date(),
            createdBy: userId,
            comment: 'Complaint created'
        };
        newComplaint.timeline = [timelineEntry];

        await newComplaint.save();

        logger.info(`Complaint created successfully by user ${userId}: ${title}`);
        res.status(201).json({ message: 'Complaint created successfully', complaintId: newComplaint._id });
    }
    catch (error) {
        logger.error('Error creating complaint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId as string;
        const role = req.role as string;
        const status = req.query.status as string | undefined;
        const priority = req.query.priority as string | undefined;
        const searchKey = req.query.q as string | undefined;

        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (searchKey) {
            filter.$or = [
                { title: { $regex: searchKey, $options: 'i' } },
                { description: { $regex: searchKey, $options: 'i' } }
            ];
        }

        let complaints;
        if (role === 'admin') {
            complaints = await Complaint.find(filter)
                .select('title description status priority createdAt assignedTo')
                .populate('createdBy', 'username')
                .populate('assignedTo', 'username');
        }
        else if (role === 'supportStaff') {
            const assignedTo = userId;
            filter.assignedTo = assignedTo;

            complaints = await Complaint.find(filter)
                .select('title description status priority createdAt')
                .populate('createdBy', 'username');
        }
        else if (role === 'user') {
            filter.createdBy = userId;
            complaints = await Complaint.find(filter)
                .select('title description status createdAt');
        }

        res.status(200).json({ complaints, message: `enga service ah use pannadhuku nandri` });
    }
    catch (error) {
        logger.error('Error fetching complaints:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get("/:id", verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const complaintId = req.params.id;
        const userId = req.userId as string;
        const role = req.role as string;

        const complaint = await Complaint.findById(complaintId)
            .populate('createdBy', 'username')
            .populate('assignedTo', 'username');

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const creatorId = (complaint.createdBy as any)._id
            ? (complaint.createdBy as any)._id.toString()
            : complaint.createdBy.toString();

        const assigneeId = complaint.assignedTo
            ? ((complaint.assignedTo as any)._id
                ? (complaint.assignedTo as any)._id.toString()
                : complaint.assignedTo.toString())
            : null;

        let assigneeEmail: any = null;
        if (assigneeId) {
            const assignee = await User.findById(assigneeId).select('email');
            assigneeEmail = assignee ? assignee.email : null;
        }

        if (
            creatorId !== userId
            && assigneeId !== userId
            && role !== 'admin'
        ) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to access this resource" });
        }

        res.status(200).json({ complaint, assigneeEmail });
    }
    catch (error) {
        logger.error('Error fetching complaint details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const complaintId = req.params.id;
        const userId = req.userId as string;
        const role = req.role as string;
        const { title, description, status, priority, assignedTo, comment } = req.body;

        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        let isAuthorized = false;
        let timelineComment = comment; // Store what actually changed for the timeline

        if (role === 'admin') {
            isAuthorized = true;

            let assignedStaff = null;

            if (assignedTo) {
                assignedStaff = await User.findOne({ email: assignedTo });
            }

            if (!assignedStaff || assignedStaff.role !== 'supportStaff') {
                return res.status(400).json({ message: "Invalid assignedTo: No support staff found with that email" });
            }

            if (assignedStaff && complaint.assignedTo?.toString() !== assignedStaff._id.toString()) {
                complaint.assignedTo = assignedStaff._id;
                timelineComment = timelineComment || 'Complaint reassigned';
            }

            if (status && complaint.status !== status) {
                complaint.status = status;
                timelineComment = timelineComment || `Status changed to ${status}`;
            }

            if (priority && complaint.priority !== priority) {
                complaint.priority = priority;
                timelineComment = timelineComment || `Priority changed to ${priority}`;
            }
        }
        else if (role === 'supportStaff') {
            if (complaint.assignedTo?.toString() !== userId) {
                return res.status(403).json({ message: "Forbidden: You don't have permission to update this complaint" });
            }
            isAuthorized = true;

            if (status && complaint.status !== status) {
                complaint.status = status;
                timelineComment = timelineComment || `Status changed to ${status}`;
            }

            if (priority && complaint.priority !== priority) {
                complaint.priority = priority;
                timelineComment = timelineComment || `Priority changed to ${priority}`;
            }
        }
        else if (role === 'user') {
            if (complaint.createdBy.toString() !== userId) {
                return res.status(403).json({ message: "Forbidden: You don't have permission to update this complaint" });
            }
            isAuthorized = true;

            if (title) complaint.title = title;
            if (description) complaint.description = description;

            if (status && complaint.status !== status) {
                complaint.status = status;
                timelineComment = timelineComment || `Status changed to ${status}`;
            }
        }

        // SECURITY CATCH-ALL
        if (!isAuthorized) {
            return res.status(403).json({ message: "Unauthorized action" });
        }

        // ONLY push to timeline if we generated a timelineComment (meaning something actually changed)
        if (timelineComment) {
            const timelineEntry: any = {
                status: complaint.status,
                timestamp: new Date(),
                createdBy: userId,
                comment: timelineComment
            };

            complaint.timeline?.push(timelineEntry);
        }

        await complaint.save();

        logger.info(`Complaint updated successfully by user ${userId}: ${complaintId}`);
        res.status(200).json({ message: 'Complaint updated successfully' });
    }
    catch (error) {
        logger.error('Error updating complaint:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put(
    '/:id/status',
    verifyToken,
    authorizeRoles('admin', 'supportStaff'),
    async (req: AuthRequest, res: Response) => {
        try {
            const complaintId = req.params.id;
            const userId = req.userId as string;
            const role = req.role as string;
            const { status, comment } = req.body;

            const complaint = await Complaint.findById(complaintId);

            if (!complaint) {
                return res.status(404).json({ message: 'Complaint not found' });
            }

            if (role === 'supportStaff' && complaint.assignedTo?.toString() !== userId) {
                return res.status(403).json({ message: "Forbidden: You don't have permission to update this complaint" });
            }

            if (complaint.status === status) {
                return res.status(400).json({ message: `Complaint is already marked as ${status}` });
            }

            complaint.status = status;

            const timelineEntry: any = {
                status,
                timestamp: new Date(),
                createdBy: userId,
                comment: comment || `Status changed to ${status}`
            };

            complaint.timeline?.push(timelineEntry);

            await complaint.save();

            logger.info(`Complaint status updated successfully by user ${userId}: ${complaintId}`);
            res.status(200).json({ message: 'Complaint status updated successfully' });
        }
        catch (error) {
            logger.error('Error updating complaint status:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

router.post('/:id/feedback', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const complaintId = req.params.id;
        const userId = req.userId as string;
        const role = req.role as string;
        const { rating, comment } = req.body;

        if (role !== 'user') {
            return res.status(403).json({ message: "Forbidden: Only users can provide feedback" });
        }

        const complaint = await Complaint.findById(complaintId);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.createdBy.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden: You don't have permission to provide feedback for this complaint" });
        }

        if (complaint.status !== 'resolved' && complaint.status !== 'closed') {
            return res.status(400).json({ message: "Feedback can only be provided for resolved or closed complaints" });
        }

        complaint.feedback = {
            rating,
            comment,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await complaint.save();

        logger.info(`Feedback added successfully by user ${userId} for complaint ${complaintId}`);
        res.status(200).json({ message: 'Feedback added successfully' });
    }
    catch (error) {
        logger.error('Error adding feedback:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
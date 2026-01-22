import prisma from '../utils/prismaClient.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new scheduled issue
// @route   POST /api/scheduled-issues
// @access  Private
const createScheduledIssue = asyncHandler(async (req, res) => {
    const {
        boardId,
        title,
        description,
        frequency,
        startDate,
        time, // "HH:mm"
        template
    } = req.body;

    if (!boardId || !title || !frequency || !startDate || !time) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Parse start date and time
    const startDateTime = new Date(startDate);
    const [hours, minutes] = time.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    // Ensure start date is in the future, or at least valid
    // If it's in the past, the scheduler will pick it up immediately if we set nextRunAt to it.

    const scheduledIssue = await prisma.scheduledIssue.create({
        data: {
            boardId,
            title,
            description,
            frequency,
            nextRunAt: startDateTime,
            template: template || {},
            isActive: true
        }
    });

    res.status(201).json(scheduledIssue);
});

// @desc    Get all scheduled issues for a board
// @route   GET /api/scheduled-issues/board/:boardId
// @access  Private
const getScheduledIssuesByBoard = asyncHandler(async (req, res) => {
    const { boardId } = req.params;

    const scheduledIssues = await prisma.scheduledIssue.findMany({
        where: { boardId },
        orderBy: { createdAt: 'desc' }
    });

    res.json(scheduledIssues);
});

// @desc    Update a scheduled issue
// @route   PUT /api/scheduled-issues/:id
// @access  Private
const updateScheduledIssue = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, frequency, isActive, template, nextRunAt } = req.body;

    const scheduledIssue = await prisma.scheduledIssue.findUnique({
        where: { id }
    });

    if (!scheduledIssue) {
        res.status(404);
        throw new Error('Scheduled issue not found');
    }

    const updatedScheduledIssue = await prisma.scheduledIssue.update({
        where: { id },
        data: {
            title: title || scheduledIssue.title,
            description: description !== undefined ? description : scheduledIssue.description,
            frequency: frequency || scheduledIssue.frequency,
            isActive: isActive !== undefined ? isActive : scheduledIssue.isActive,
            template: template || scheduledIssue.template,
            nextRunAt: nextRunAt ? new Date(nextRunAt) : scheduledIssue.nextRunAt
        }
    });

    res.json(updatedScheduledIssue);
});

// @desc    Delete a scheduled issue
// @route   DELETE /api/scheduled-issues/:id
// @access  Private
const deleteScheduledIssue = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const scheduledIssue = await prisma.scheduledIssue.findUnique({
        where: { id }
    });

    if (!scheduledIssue) {
        res.status(404);
        throw new Error('Scheduled issue not found');
    }

    await prisma.scheduledIssue.delete({
        where: { id }
    });

    res.json({ message: 'Scheduled issue removed' });
});

export {
    createScheduledIssue,
    getScheduledIssuesByBoard,
    updateScheduledIssue,
    deleteScheduledIssue
};

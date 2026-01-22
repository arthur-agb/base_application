import prisma from '../utils/prismaClient.js';
import { v4 as uuidv4 } from 'uuid';
import SocketHandlers from '../utils/socketHandlers.js';

const includeIssueDetails = {
    reporter: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
    assignee: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
    column: { select: { id: true, name: true } },
    project: { select: { id: true, name: true, key: true, projectLead: { select: { id: true, username: true, displayName: true } } } },
    epic: { select: { id: true, title: true } },
    sprint: { select: { id: true, title: true } },
    parentIssue: { select: { id: true, title: true, type: true } },
};

class SchedulerService {
    constructor() {
        this.intervalId = null;
        this.checkInterval = 60 * 1000; // Check every minute
    }

    initScheduler() {
        if (this.intervalId) {
            console.log('Scheduler already running.');
            return;
        }
        console.log('Starting Scheduler Service...');
        this.intervalId = setInterval(() => {
            this.processDueIssues();
        }, this.checkInterval);
    }

    stopScheduler() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('Scheduler stopped.');
        }
    }

    async processDueIssues() {
        try {
            const now = new Date();

            // Find issues that are active and due (nextRunAt <= now)
            const dueIssues = await prisma.scheduledIssue.findMany({
                where: {
                    isActive: true,
                    nextRunAt: {
                        lte: now
                    }
                },
                include: {
                    board: true
                }
            });

            if (dueIssues.length > 0) {
                console.log(`Found ${dueIssues.length} due scheduled issues.`);
            }

            for (const scheduledIssue of dueIssues) {
                await this.executeScheduledIssue(scheduledIssue);
            }

        } catch (error) {
            console.error('Error processing due issues:', error);
        }
    }

    async executeScheduledIssue(scheduledIssue) {
        try {
            console.log(`Processing scheduled issue: ${scheduledIssue.title} (${scheduledIssue.id})`);

            const now = new Date();
            let nextRunAt = new Date(scheduledIssue.nextRunAt);
            let iterations = 0;
            const MAX_CATCHUP = 50; // Safety limit to prevent infinite loops

            // Loop to catch up on missed runs
            // We check if nextRunAt is in the past (<= now)
            while (nextRunAt <= now && iterations < MAX_CATCHUP) {
                console.log(`Executing run #${iterations + 1} for ${scheduledIssue.title} (Scheduled: ${nextRunAt.toISOString()})`);

                // 1. Create the issue
                await this.createIssueFromSchedule(scheduledIssue);

                // 2. Calculate next run time based on the CURRENT iteration's scheduled time
                // This ensures we stick to the original schedule (e.g., 9:00 AM) regardless of when the server actually runs
                nextRunAt = this.calculateNextRun(nextRunAt, scheduledIssue);

                // 3. Update DB immediately to persist progress
                // This ensures that if the server crashes during catch-up, we don't re-process the ones we just finished.
                await prisma.scheduledIssue.update({
                    where: { id: scheduledIssue.id },
                    data: {
                        lastRunAt: new Date(), // The actual time we ran it
                        nextRunAt: nextRunAt   // The next scheduled time
                    }
                });

                iterations++;
            }

            if (iterations >= MAX_CATCHUP) {
                console.warn(`Scheduled issue ${scheduledIssue.id} reached max catch-up limit (${MAX_CATCHUP}). Stopping catch-up.`);
            }

        } catch (error) {
            console.error(`Failed to execute scheduled issue ${scheduledIssue.id}:`, error);
        }
    }

    async createIssueFromSchedule(scheduledIssue) {
        try {
            const template = scheduledIssue.template || {};

            // Determine column: Use template column or default to first column of board
            let columnId = template.columnId;
            if (!columnId) {
                const firstColumn = await prisma.momentumColumn.findFirst({
                    where: { boardId: scheduledIssue.boardId },
                    orderBy: { position: 'asc' }
                });
                if (firstColumn) columnId = firstColumn.id;
            }

            if (!columnId) {
                console.error(`No column found for board ${scheduledIssue.boardId}, skipping issue creation.`);
                return;
            }

            // Calculate position: Put at the bottom of the column
            const highestPositionIssue = await prisma.momentumIssue.findFirst({
                where: { columnId: columnId },
                orderBy: { position: 'desc' },
                select: { position: true }
            });
            const position = (highestPositionIssue?.position !== null && highestPositionIssue?.position !== undefined) ? highestPositionIssue.position + 1 : 0;

            // Create the issue
            const newIssue = await prisma.momentumIssue.create({
                data: {
                    projectId: scheduledIssue.board.projectId,
                    boardId: scheduledIssue.boardId,
                    columnId: columnId,
                    title: scheduledIssue.title,
                    description: scheduledIssue.description,
                    type: template.type || 'TASK',
                    priority: template.priority || 'MEDIUM',
                    status: template.status || 'TODO',
                    category: template.category || 'TODO',
                    position: position,
                    reporterUserId: template.reporterId,
                    assigneeUserId: template.assigneeId,
                    storyPoints: template.storyPoints,
                    labels: template.labels || [],
                }
            });

            console.log(`Created issue ${newIssue.id} from schedule ${scheduledIssue.id}`);

            // Emit WebSocket event to update open boards
            const boardId = scheduledIssue.boardId;
            const projectId = scheduledIssue.board.projectId;

            // Fetch all issues for the project to send complete state (matching issue.service pattern)
            const allProjectIssues = await prisma.momentumIssue.findMany({
                where: { projectId: projectId },
                include: includeIssueDetails,
                orderBy: [{ columnId: 'asc' }, { position: 'asc' }]
            });

            if (boardId) {
                const payload = {
                    boardId: boardId,
                    issues: allProjectIssues,
                    updatedIssueId: newIssue.id,
                    action: 'create'
                };
                try {
                    SocketHandlers.emitToRoom(`board_${boardId}`, 'board_updated', payload);
                    console.log(`Emitted 'board_updated' to room 'board_${boardId}' for scheduled issue creation`);
                } catch (socketError) {
                    console.error(`Failed to emit WebSocket event 'board_updated' to room 'board_${boardId}':`, socketError);
                }
            }

        } catch (error) {
            console.error(`Error creating issue for schedule ${scheduledIssue.id}:`, error);
            throw error; // Re-throw to stop the catch-up loop for this specific issue if creation fails
        }
    }

    calculateNextRun(baseDate, scheduledIssue) {
        const nextDate = new Date(baseDate);
        const config = scheduledIssue.customConfig || {};

        switch (scheduledIssue.frequency) {
            case 'DAILY':
                // Support "Every X Days"
                const interval = config.interval || 1;
                nextDate.setDate(nextDate.getDate() + interval);
                break;

            case 'WEEKLY':
                // Support "Specific Days of Week"
                const days = config.days; // Array of 0-6
                if (days && days.length > 0) {
                    const currentDay = nextDate.getDay();
                    const sortedDays = days.sort((a, b) => a - b);

                    // Find next day in the list
                    const nextDay = sortedDays.find(d => d > currentDay);

                    if (nextDay !== undefined) {
                        // Found a day later in this week
                        nextDate.setDate(nextDate.getDate() + (nextDay - currentDay));
                    } else {
                        // Wrap around to the first day of next week
                        const firstDay = sortedDays[0];
                        const daysUntilNextWeek = 7 - currentDay + firstDay;
                        nextDate.setDate(nextDate.getDate() + daysUntilNextWeek);
                    }
                } else {
                    // Default weekly
                    nextDate.setDate(nextDate.getDate() + 7);
                }
                break;

            case 'MONTHLY':
                // Support "On Day X of Month"
                nextDate.setMonth(nextDate.getMonth() + 1);

                if (config.dayOfMonth) {
                    const targetDay = config.dayOfMonth;
                    // Handle month lengths (e.g. trying to set 31st in Feb)
                    // Set to 1st of target month first to avoid overflow issues
                    nextDate.setDate(1);
                    const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                    nextDate.setDate(Math.min(targetDay, daysInMonth));
                }
                break;

            case 'CUSTOM':
                // Default to daily for now
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            default:
                nextDate.setDate(nextDate.getDate() + 1);
        }

        return nextDate;
    }
}

export const schedulerService = new SchedulerService();

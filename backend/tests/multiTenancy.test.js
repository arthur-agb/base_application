import { jest } from '@jest/globals';

// Mock Prisma
jest.unstable_mockModule('../utils/prismaClient.js', () => ({
    default: {
        project: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
        },
        momentumIssue: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            groupBy: jest.fn(),
            count: jest.fn(),
        },
        momentumHistory: {
            findMany: jest.fn(),
        },
        momentumProjectMember: {
            count: jest.fn(),
        },
    },
}));

// Import service after mocking
const { getProjectsForUser, getProjectByKey } = await import('../services/project.service.js');
const prisma = (await import('../utils/prismaClient.js')).default;

describe('Multi-Tenancy Smoke Tests', () => {
    const mockUserId = 'user-123';
    const mockCompanyId = 'company-456';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProjectsForUser', () => {
        it('should filter by companyId when in company context', async () => {
            prisma.project.findMany.mockResolvedValue([]);
            prisma.project.count.mockResolvedValue(0);

            await getProjectsForUser(mockCompanyId, mockUserId, 'ADMIN');

            expect(prisma.project.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        companyId: mockCompanyId,
                    }),
                })
            );
        });

        it('should filter by companyId: null and membership when in personal context', async () => {
            prisma.project.findMany.mockResolvedValue([]);
            prisma.project.count.mockResolvedValue(0);

            await getProjectsForUser(null, mockUserId, null);

            expect(prisma.project.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        companyId: null,
                        members: {
                            some: {
                                userId: mockUserId,
                            },
                        },
                    }),
                })
            );
        });
    });

    describe('getProjectByKey', () => {
        it('should strictly enforce companyId when fetching by key', async () => {
            prisma.project.findFirst.mockResolvedValue(null);

            const projectKey = 'PROJ';
            await getProjectByKey(projectKey, mockCompanyId);

            expect(prisma.project.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        key: projectKey,
                        companyId: mockCompanyId,
                    },
                })
            );
        });
    });

    describe('checkProjectMembership', () => {
        it('should verify project membership within the correct company context', async () => {
            prisma.project.findFirst.mockResolvedValue({
                id: 'proj-1',
                members: [{ userId: mockUserId }]
            });

            const { checkProjectMembership } = await import('../services/project.service.js');

            await checkProjectMembership(mockUserId, mockCompanyId, 'proj-1', false);

            expect(prisma.project.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        companyId: mockCompanyId,
                    }),
                })
            );
        });

        it('should throw 404 if project exists but in a different company', async () => {
            prisma.project.findFirst.mockResolvedValue(null);

            const { checkProjectMembership } = await import('../services/project.service.js');

            await expect(
                checkProjectMembership(mockUserId, 'wrong-company', 'proj-1', false)
            ).rejects.toThrow('Project not found in this company');
        });
    });

    describe('IssueService', () => {
        it('should throw 404 if issue belongs to a project in a different company', async () => {
            // Mock issue belonging to a different company
            prisma.project.findUnique = jest.fn().mockResolvedValue({
                id: 'proj-1',
                companyId: 'other-company',
                members: [],
                projectLead: { id: 'other-user' }
            });

            // Mock findUnique for the issue itself
            prisma.momentumIssue.findUnique = jest.fn().mockResolvedValue({
                id: 'issue-1',
                project: {
                    id: 'proj-1',
                    companyId: 'other-company',
                    members: [],
                    projectLead: { id: 'other-user' }
                }
            });

            const { getIssueById } = await import('../services/issue.service.js');

            await expect(
                getIssueById('issue-1', mockUserId, mockCompanyId, null)
            ).rejects.toThrow('Issue not found in current workspace context');
        });
    });
});

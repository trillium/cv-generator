import { NextRequest, NextResponse } from "next/server";
import { MultiResumeManager } from "../../../lib/multiResumeManager";
import { CreateResumeVersionOptions, ResumeListOptions } from "../../../lib/types/multiResume";

const multiResumeManager = new MultiResumeManager();

// Helper function to perform auto-scan after operations
function performAutoScan(): void {
    try {
        multiResumeManager.scanAndUpdateIndex();
    } catch (error) {
        console.warn('Auto-scan failed:', error);
        // Don't throw - we don't want scan failures to break the main operation
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'list': {
                const options: ResumeListOptions = {
                    position: searchParams.get('position') || undefined,
                    company: searchParams.get('company') || undefined,
                    status: (searchParams.get('status') as any) || undefined,
                    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
                    sortBy: (searchParams.get('sortBy') as any) || 'lastModified',
                    sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
                };

                const result = multiResumeManager.listResumeVersions(options);
                return NextResponse.json(result);
            }

            case 'get': {
                const position = searchParams.get('position');
                const company = searchParams.get('company') || undefined;
                const date = searchParams.get('date') || undefined;

                if (!position) {
                    return NextResponse.json(
                        { error: 'Position is required' },
                        { status: 400 }
                    );
                }

                const version = multiResumeManager.getResumeVersion(position, company, date);
                if (!version) {
                    return NextResponse.json(
                        { error: 'Resume version not found' },
                        { status: 404 }
                    );
                }

                return NextResponse.json(version);
            }

            case 'navigation': {
                const navData = multiResumeManager.getNavigationData();
                return NextResponse.json(navData);
            }

            case 'data': {
                const position = searchParams.get('position');
                const company = searchParams.get('company') || undefined;
                const date = searchParams.get('date') || undefined;

                const context = position ? { position, company, date } : undefined;
                const yamlContent = multiResumeManager.getYamlData(context);

                return NextResponse.json({ yamlContent });
            }

            case 'scan': {
                const scanResult = multiResumeManager.scanAndUpdateIndex();
                return NextResponse.json({
                    message: 'File system scan completed',
                    result: scanResult
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Supported actions: list, get, navigation, data, scan' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Multi-resume API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'create': {
                const options: CreateResumeVersionOptions = {
                    position: body.position,
                    company: body.company,
                    basedOn: body.basedOn,
                    description: body.description,
                    tags: body.tags,
                    applicationDeadline: body.applicationDeadline,
                    jobUrl: body.jobUrl,
                    notes: body.notes
                };

                if (!options.position) {
                    return NextResponse.json(
                        { error: 'Position is required' },
                        { status: 400 }
                    );
                }

                const newVersion = await multiResumeManager.createResumeVersion(options);

                // Auto-scan to ensure index is up to date
                performAutoScan();

                return NextResponse.json(newVersion);
            }

            case 'copy': {
                const {
                    sourcePosition,
                    sourceCompany,
                    sourceDate,
                    targetOptions
                } = body;

                if (!sourcePosition || !targetOptions?.position) {
                    return NextResponse.json(
                        { error: 'Source position and target options are required' },
                        { status: 400 }
                    );
                }

                const newVersion = await multiResumeManager.copyResumeVersion(
                    sourcePosition,
                    targetOptions,
                    sourceCompany,
                    sourceDate
                );

                // Auto-scan to ensure index is up to date
                performAutoScan();

                return NextResponse.json(newVersion);
            }

            case 'update-content': {
                const { position, company, date, content } = body;

                if (!position || !content) {
                    return NextResponse.json(
                        { error: 'Position and content are required' },
                        { status: 400 }
                    );
                }

                multiResumeManager.updateResumeContent(position, content, company, date);

                // Auto-scan to ensure index is up to date
                performAutoScan();

                return NextResponse.json({ success: true });
            }

            case 'update-metadata': {
                const { position, company, date, updates } = body;

                if (!position || !updates) {
                    return NextResponse.json(
                        { error: 'Position and updates are required' },
                        { status: 400 }
                    );
                }

                const updated = multiResumeManager.updateResumeMetadata(
                    position,
                    updates,
                    company,
                    date
                );

                if (!updated) {
                    return NextResponse.json(
                        { error: 'Resume version not found' },
                        { status: 404 }
                    );
                }

                // Auto-scan to ensure index is up to date
                performAutoScan();

                return NextResponse.json(updated);
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Supported actions: create, copy, update-content, update-metadata' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Multi-resume API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const position = searchParams.get('position');
        const company = searchParams.get('company') || undefined;
        const date = searchParams.get('date') || undefined;

        if (!position) {
            return NextResponse.json(
                { error: 'Position is required' },
                { status: 400 }
            );
        }

        const deleted = multiResumeManager.deleteResumeVersion(position, company, date);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Resume version not found' },
                { status: 404 }
            );
        }

        // Auto-scan to ensure index is up to date
        performAutoScan();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Multi-resume API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}

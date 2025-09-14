export async function GET() {
    return Response.json({ message: 'test ok', timestamp: new Date() });
}
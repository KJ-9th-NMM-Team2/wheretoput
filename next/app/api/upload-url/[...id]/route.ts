import { NextRequest } from "next/server";
import getFileUrl from "../getFileUrl";

/**
 * @swagger
 * /api/upload-url/{...id}:
 *   get:
 *     tags:
 *       - File
 *     summary: Get file download URL
 *     description: Retrieves a signed download URL for a file stored in S3
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: File path segments (can include slashes)
 *         example: folder/subfolder/filename.jpg
 *     responses:
 *       200:
 *         description: File download URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 downloadUrl:
 *                   type: string
 *                   description: Signed URL for downloading the file
 *                   example: https://s3.amazonaws.com/bucket/path/to/file.jpg?signature=...
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string[] } }
) {
  const { id } = await params;
  const decoded_key: string = id.join("/");
  const downloadUrl = await getFileUrl(decoded_key);
  console.log(downloadUrl);
  return Response.json({ downloadUrl });
}

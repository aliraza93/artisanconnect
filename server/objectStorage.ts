import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObjectS3,
  getObjectAclPolicyS3,
  setObjectAclPolicyS3,
} from "./objectAcl";

// AWS S3 Configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || "";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";

// Initialize S3 Client
export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

// S3 File wrapper to maintain compatibility with existing code
export interface S3File {
  bucket: string;
  key: string;
  exists(): Promise<boolean>;
  getMetadata(): Promise<{ contentType?: string; size?: number; metadata?: Record<string, string> }>;
  createReadStream(): Readable;
}

class S3FileImpl implements S3File {
  constructor(public bucket: string, public key: string) {}

  async exists(): Promise<boolean> {
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
      }));
      return true;
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(): Promise<{ contentType?: string; size?: number; metadata?: Record<string, string> }> {
    try {
      const response = await s3Client.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
      }));
      
      return {
        contentType: response.ContentType,
        size: response.ContentLength,
        metadata: response.Metadata,
      };
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        throw new ObjectNotFoundError();
      }
      throw error;
    }
  }

  createReadStream(): Readable {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.key,
    });
    
    // In Node.js, AWS SDK v3 Body is typically a Readable stream
    // We'll create a wrapper stream that handles the async response
    const stream = new Readable({
      read() {
        // This will be populated by the async operation
      },
    });

    s3Client.send(command)
      .then(async (response) => {
        if (!response.Body) {
          stream.push(null);
          return;
        }

        try {
          // In Node.js environment, Body is typically a Readable stream
          if (response.Body instanceof Readable) {
            // Already a Node.js Readable stream - pipe it
            response.Body.on('data', (chunk) => {
              stream.push(chunk);
            });
            response.Body.on('end', () => {
              stream.push(null);
            });
            response.Body.on('error', (err) => {
              stream.destroy(err);
            });
          } else if (response.Body instanceof ReadableStream) {
            // Browser ReadableStream - convert to Node.js Readable
            const reader = response.Body.getReader();
            const pump = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    stream.push(null);
                    break;
                  }
                  stream.push(Buffer.from(value));
                }
              } catch (error) {
                stream.destroy(error as Error);
              }
            };
            pump();
          } else {
            // Handle as Blob or Uint8Array
            let buffer: Buffer;
            if (response.Body instanceof Uint8Array) {
              buffer = Buffer.from(response.Body);
            } else {
              // Try to get arrayBuffer from Blob-like object
              const arrayBuffer = await (response.Body as any).arrayBuffer?.() || 
                                (response.Body as any).transformToByteArray?.();
              buffer = Buffer.from(arrayBuffer || response.Body);
            }
            stream.push(buffer);
            stream.push(null);
          }
        } catch (error) {
          stream.destroy(error as Error);
        }
      })
      .catch((error) => {
        stream.destroy(error);
      });

    return stream;
  }
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {
    // Validate AWS configuration
    if (!AWS_S3_BUCKET) {
      console.warn("Warning: AWS_S3_BUCKET environment variable is not set. S3 operations will fail.");
    }
  }

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      // For S3, we can use the bucket root or a public prefix
      return [""];
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "uploads";
    return dir;
  }

  getBucketName(): string {
    if (!AWS_S3_BUCKET) {
      throw new Error(
        "AWS_S3_BUCKET not set. Please set AWS_S3_BUCKET environment variable with your S3 bucket name."
      );
    }
    return AWS_S3_BUCKET;
  }

  async searchPublicObject(filePath: string): Promise<S3File | null> {
    const bucket = this.getBucketName();
    
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = searchPath ? `${searchPath}/${filePath}` : filePath;
      const key = fullPath.startsWith("/") ? fullPath.slice(1) : fullPath;
      
      const file = new S3FileImpl(bucket, key);
      const exists = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }

  async downloadObject(file: S3File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const metadata = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicyS3(file);
      const isPublic = aclPolicy?.visibility === "public";
      
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size?.toString() || "0",
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
    const bucket = this.getBucketName();
    const privateObjectDir = this.getPrivateObjectDir();

    const objectId = randomUUID();
    // Use privateObjectDir directly, don't add /uploads/ again
    const key = `${privateObjectDir}/${objectId}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const uploadURL = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    return {
      uploadURL,
      objectPath: `/objects/${objectId}`,
    };
  }

  async getSignedReadURL(objectPath: string): Promise<string> {
    const file = await this.getObjectEntityFile(objectPath);
    const bucket = this.getBucketName();
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: file.key,
    });

    return getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });
  }

  async getObjectEntityFile(objectPath: string): Promise<S3File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    // Remove "objects" prefix, get the rest as entityId
    const entityId = parts.slice(1).join("/");
    const privateObjectDir = this.getPrivateObjectDir();
    // Construct key: privateObjectDir/entityId (no extra /uploads/)
    const key = `${privateObjectDir}/${entityId}`;
    const bucket = this.getBucketName();

    const file = new S3FileImpl(bucket, key);
    const exists = await file.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return file;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // Handle S3 URLs
    if (rawPath.startsWith("https://") && rawPath.includes(".s3.")) {
      try {
        const url = new URL(rawPath);
        const bucket = this.getBucketName();
        
        // Extract key from path
        const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
        const privateObjectDir = this.getPrivateObjectDir();
        
        if (key.startsWith(`${privateObjectDir}/`)) {
          const entityId = key.slice(privateObjectDir.length + 1);
          return `/objects/${entityId}`;
        }
      } catch (error) {
        // If URL parsing fails, return as is
        return rawPath;
      }
    }

    // Handle old GCS URLs for backward compatibility
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const url = new URL(rawPath);
      const rawObjectPath = url.pathname;

      const privateObjectDir = this.getPrivateObjectDir();
      const objectEntityDir = privateObjectDir.endsWith("/") 
        ? privateObjectDir 
        : `${privateObjectDir}/`;

      if (rawObjectPath.startsWith(`/${objectEntityDir}`)) {
        const entityId = rawObjectPath.slice(objectEntityDir.length + 1);
        return `/objects/${entityId}`;
      }
    }

    return rawPath;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicyS3(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: S3File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObjectS3({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

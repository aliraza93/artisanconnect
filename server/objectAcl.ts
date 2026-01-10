import { File } from "@google-cloud/storage";
import { S3Client, PutObjectCommand, HeadObjectCommand, CopyObjectCommand, PutObjectAclCommand } from "@aws-sdk/client-s3";
import { s3Client, S3File } from "./objectStorage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

export enum ObjectAccessGroupType {}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (aclPolicy.owner === userId) {
    return true;
  }

  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}

// S3-compatible ACL functions
export async function setObjectAclPolicyS3(
  objectFile: S3File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const exists = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.key}`);
  }

  // If visibility is public, set S3 object ACL to public-read
  if (aclPolicy.visibility === "public") {
    try {
      const putAclCommand = new PutObjectAclCommand({
        Bucket: objectFile.bucket,
        Key: objectFile.key,
        ACL: "public-read",
      });
      await s3Client.send(putAclCommand);
      console.log(`Set object ${objectFile.key} to public-read`);
    } catch (error: any) {
      console.error("Error setting S3 object ACL to public-read:", error);
      // Continue even if ACL setting fails
    }
  }

  // Get current metadata
  const currentMetadata = await objectFile.getMetadata();
  
  // Update metadata with ACL policy
  const updatedMetadata = {
    ...(currentMetadata.metadata || {}),
    [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
  };

  // Copy object to itself with updated metadata
  const copyCommand = new CopyObjectCommand({
    Bucket: objectFile.bucket,
    CopySource: `${objectFile.bucket}/${objectFile.key}`,
    Key: objectFile.key,
    Metadata: updatedMetadata,
    MetadataDirective: "REPLACE",
    ACL: aclPolicy.visibility === "public" ? "public-read" : "private",
  });

  await s3Client.send(copyCommand);
}

export async function getObjectAclPolicyS3(
  objectFile: S3File,
): Promise<ObjectAclPolicy | null> {
  const metadata = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  try {
    return JSON.parse(aclPolicy);
  } catch (error) {
    console.error("Error parsing ACL policy:", error);
    return null;
  }
}

export async function canAccessObjectS3({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: S3File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicyS3(objectFile);
  if (!aclPolicy) {
    return false;
  }

  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (aclPolicy.owner === userId) {
    return true;
  }

  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}

import * as GCS from "@google-cloud/storage";
import { randomUUID } from "crypto";
const gcsClient = new GCS.Storage();

/**
 * バケットの作成
 * @param bucketName バケット名
 * @returns true:成功/false:失敗
 */
const createBucket = async (bucketName: string): Promise<boolean> => {
  const metadata: GCS.CreateBucketRequest = {
    location: "asia-northeast1", // ロケーションの設定
    storageClass: "Standard", // ストレージクラスの設定
    cors: [
      // CORSの設定
      {
        origin: ["*"],
        method: ["GET", "HEAD", "PUT", "POST", "DELETE"],
        responseHeader: ["*"],
        maxAgeSeconds: 3600,
      },
    ],
    versioning: {
      // バージョニングの設定
      enabled: false,
    },
  };
  try {
    const res = await gcsClient.createBucket(bucketName, metadata);
    console.log(res);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * バケット一覧の取得
 * @returns
 */
const listBuckets = async (): Promise<string[]> => {
  try {
    const [buckets] = await gcsClient.getBuckets();
    const bucketList: string[] = [];
    buckets.forEach((bucket: any) => {
      bucketList.push(bucket.name);
    });
    return bucketList;
  } catch (err) {
    console.error(err);
    return [];
  }
};

/**
 * バケットの削除
 * @param bucketName バケット名
 * @returns true:成功/false:失敗
 */
const deleteBucket = async (bucketName: string): Promise<boolean> => {
  try {
    const res = await gcsClient
      .bucket(bucketName)
      .delete({ ignoreNotFound: true });
    console.log(`${res[0].statusCode}: ${res[0].statusMessage}`);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * オブジェクトの保存
 * @param bucketName バケット名
 * @param dstPath 保存先パス
 * @param object 保存するオブジェクト
 * @returns true:成功/false:失敗
 */
const putObject = async (
  bucketName: string,
  dstPath: string,
  object: string
): Promise<boolean> => {
  try {
    await gcsClient.bucket(bucketName).file(dstPath).save(object);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * オブジェクト一覧の取得
 * @param bucketName バケット名
 * @param prefix オブジェクト一覧を取得するフォルダのパス
 * @param delimiter デリミタ
 * @returns オブジェクト一覧
 */
const listObjects = async (
  bucketName: string,
  prefix?: string,
  delimiter?: string
): Promise<string[]> => {
  const objectList: string[] = [];
  try {
    const [objects] = await gcsClient
      .bucket(bucketName)
      .getFiles({ prefix, delimiter });

    objects.forEach((file) => {
      objectList.push(file.name);
    });
  } catch (err) {
    console.error(err);
  }
  return objectList;
};

/**
 * オブジェクトの取得
 * @param bucketName バケット名
 * @param path 取得対象のオブジェクトのパス
 * @returns オブジェクト/false:取得失敗
 */
const getObject = async (
  bucketName: string,
  path: string
): Promise<string | false> => {
  try {
    const data = await gcsClient.bucket(bucketName).file(path).download();
    return data[0].toString();
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * オブジェクトの削除
 * @param bucketName バケット名
 * @param path 削除対象オブジェクトのパス
 * @returns true:成功/false:失敗
 */
const deleteObject = async (
  bucketName: string,
  path: string
): Promise<boolean> => {
  try {
    const [res] = await gcsClient
      .bucket(bucketName)
      .file(path)
      .delete({ ignoreNotFound: true });
    console.log(`${res.statusCode}: ${res.statusMessage}`);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const runAll = async () => {
  const bucketName = randomUUID().toString();

  // バケットの作成
  console.log(">>> Create bucket");
  await createBucket(bucketName);

  // バケット一覧の取得
  console.log(">>> List buckets");
  const bucketLists = await listBuckets();
  console.log(bucketLists);

  // バケットにJSONを保存
  console.log(">>> Put JSON");
  const path = "data.json";
  const json = { key: "value" };
  await putObject(bucketName, path, JSON.stringify(json));

  // バケットからJSONを取得
  console.log(">>> Get object");
  const res = await getObject(bucketName, path);
  console.log(res);

  // バケットからオブジェクト一覧を取得
  console.log(">>> List objects");
  const objectList = await listObjects(bucketName);
  console.log(objectList);

  // バケットのオブジェクトを削除
  console.log(">>> Delete objects");
  for (const objPath of objectList) {
    await deleteObject(bucketName, objPath);
  }

  // バケットの削除
  console.log(">>> Delete bucket");
  await deleteBucket(bucketName);
};
runAll();

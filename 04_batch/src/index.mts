import * as Batch from "@google-cloud/batch";
import { randomUUID } from "crypto";
import { setTimeout } from "timers/promises";
const batchClient = new Batch.BatchServiceClient();

// コマンドライン引数のチェック
if (process.argv.length != 4) {
  console.error("Usage: node index.js <project id> <region>");
  process.exit(-1);
}

/**
 * ジョブの作成
 * @param projectId プロジェクトID
 * @param region リージョン
 * @param jobId ジョブID
 * @returns true:成功/false:失敗
 */
const createJob = async (
  projectId: string,
  region: string,
  jobId: string
): Promise<boolean> => {
  try {
    await batchClient.createJob({
      parent: `projects/${projectId}/locations/${region}`,
      jobId: jobId,
      job: {
        taskGroups: [
          {
            taskSpec: {
              runnables: [
                {
                  displayName: "1",
                  container: {
                    imageUri: "hello-world:latest",
                    blockExternalNetwork: false,
                    commands: [],
                    entrypoint: "",
                    volumes: [],
                  },
                  timeout: { seconds: 3600 },
                  background: false,
                  alwaysRun: false,
                  ignoreExitStatus: false,
                  labels: {},
                },
                {
                  displayName: "2",
                  container: {
                    imageUri: "hello-world:latest",
                    blockExternalNetwork: false,
                    commands: [],
                    entrypoint: "",
                    volumes: [],
                  },
                  timeout: { seconds: 3600 },
                  background: false,
                  alwaysRun: false,
                  ignoreExitStatus: false,
                  labels: {},
                },
              ],
              environments: {},
              computeResource: {
                cpuMilli: "1000",
                memoryMib: "512",
                bootDiskMib: "0",
              },
              lifecyclePolicies: [],
              maxRetryCount: 0,
            },
            taskCount: "1",
            parallelism: "1",
            schedulingPolicy: "SCHEDULING_POLICY_UNSPECIFIED",
            taskCountPerNode: "0",
            requireHostsFile: false,
            permissiveSsh: false,
          },
        ],
        logsPolicy: {
          destination: "CLOUD_LOGGING",
        },
        labels: {},
      },
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ジョブ情報の取得
 * @param jobId ジョブID
 * @returns ジョブ情報
 */
const getJobInfo = async (jobId: string): Promise<any> => {
  try {
    const [response] = await batchClient.getJob({
      name: jobId,
    });
    return response;
  } catch (err) {
    console.error(err);
    return {};
  }
};

/**
 * ジョブ一覧の取得
 * @param projectId プロジェクトID
 * @param region リージョン
 * @returns ジョブ一覧
 */
const listJobs = async (
  projectId: string,
  region: string
): Promise<string[]> => {
  try {
    const list: string[] = [];
    const iterable = batchClient.listJobsAsync({
      parent: `projects/${projectId}/locations/${region}`,
    });
    for await (const response of iterable) {
      list.push(response.name);
    }
    return list;
  } catch (err) {
    console.error(err);
    return [];
  }
};

const deleteJob = async (jobId: string): Promise<boolean> => {
  try {
    await batchClient.deleteJob({
      name: jobId,
      reason: "cancelled.",
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * 各種CloudRun操作の実行
 */
const runAll = async (): Promise<void> => {
  // プロジェクトIDの取得
  const projectId = String(process.argv[2]);
  // リージョンの取得
  const region = String(process.argv[3]);

  // ジョブの作成
  console.log(">>> Create job");
  const jobName = "job-" + randomUUID();
  await createJob(projectId, region, jobName);

  // ジョブの一覧取得
  console.log(">>> List jobs");
  const jobList = await listJobs(projectId, region);
  console.log(jobList);

  // 以下30秒後に実行
  await setTimeout(30000);
  for (const job of jobList) {
    // ジョブ情報の取得
    console.log(">>> Get job information");
    const jobInfo = await getJobInfo(job);
    console.log(JSON.stringify(jobInfo, null, "  "));
    // ジョブの削除
    console.log(">>> Delete job");
    await deleteJob(job);
  }
};
runAll();

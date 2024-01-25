import * as GCR from "@google-cloud/run";
const gcrJobClient = new GCR.JobsClient();
const gcrExecutionJobClient = new GCR.ExecutionsClient();
const gcrServiceClient = new GCR.ServicesClient();

// コマンドライン引数のチェック
if (process.argv.length != 4) {
  console.error("Usage: node index.js <project id> <region>");
  process.exit(-1);
}

/**
 * サービス一覧の取得
 * @param projectId プロジェクトID
 * @param region リージョン
 * @returns サービス一覧
 */
const listServices = async (
  projectId: string,
  region: string
): Promise<string[]> => {
  try {
    const list: string[] = [];
    const iterable = gcrServiceClient.listServicesAsync({
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

/**
 * ジョブ一覧の取得
 * @param projectId プロジェクトID
 * @param region リージョン
 * @returns ジョブ一覧
 */
const listJobs = async (projectId: string, region: string) => {
  try {
    const list: string[] = [];
    const iterable = gcrJobClient.listJobsAsync({
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

/**
 * ジョブの実行(実行完了まで待機しない場合)
 * @param jobName 実行対象のジョブ名
 * @returns true:成功/false:失敗
 */
const runJob = async (jobName: string): Promise<boolean> => {
  try {
    await gcrJobClient.runJob({
      name: jobName,
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * ジョブの実行(実行完了まで待機する場合)
 * @param jobName 実行対象のジョブ名
 * @returns true:成功/false:失敗
 */
const runJobAsync = async (jobName: string): Promise<boolean> => {
  try {
    const [operation] = await gcrJobClient.runJob({
      name: jobName,
    });
    await operation.promise();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * 実行中のジョブ一覧の取得
 * @param jobName ジョブ名
 * @returns 実行中のジョブ一覧
 */
const listProcessingJobs = async (jobName: string): Promise<string[]> => {
  const list: string[] = [];
  try {
    const iterable = gcrExecutionJobClient.listExecutionsAsync({
      parent: jobName,
    });
    for await (const response of iterable) {
      if (response.reconciling || response.runningCount > 0)
        list.push(response.name);
    }
    return list;
  } catch (err) {
    console.error(err);
    return [];
  }
};

/**
 * 実行中のジョブのキャンセル
 * @param processingJobName 実行中のジョブ名
 * @returns true:成功/false:失敗
 */
const cancelProcessingJob = async (
  processingJobName: string
): Promise<boolean> => {
  try {
    await gcrExecutionJobClient.cancelExecution({
      name: processingJobName,
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

  // サービスの一覧取得
  console.log(">>> List services");
  const serviceList = await listServices(projectId, region);
  console.log(serviceList);

  // ジョブの一覧取得
  console.log(">>> List jobs");
  const jobList = await listJobs(projectId, region);
  console.log(jobList);

  // ジョブの実行
  console.log(">>> Execute job and wait until done");
  for (const jobName of jobList) {
    await runJobAsync(jobName);
  }
  console.log(">>> Execute job");
  for (const jobName of jobList) {
    await runJob(jobName);
  }

  for (const jobName of jobList) {
    // 実行中のジョブ一覧の取得
    console.log(">>> List processing jobs");
    const processingJobList = await listProcessingJobs(jobName);
    console.log(processingJobList);
    // 実行中のジョブのキャンセル
    console.log(">>> Cancel processing jobs");
    for (const processingJobName of processingJobList) {
      console.log(processingJobName);
      await cancelProcessingJob(processingJobName);
    }
  }
};
runAll();

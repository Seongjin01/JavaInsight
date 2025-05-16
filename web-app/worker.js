// web-app/worker.js
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
// const jobStatusManager = require('./jobStatusManager'); // 이전 jobStatusManager.js를 사용한다면 이 줄 사용

// --- 중요: 사용자 환경에 맞게 수정 필요 ---
const JAVA_ANALYZER_JAR_PATH = path.resolve(__dirname, '..', 'java-analyzer', 'target', 'java-analyzer-1.0-SNAPSHOT-standalone.jar');
const JDK_JAVA_EXECUTABLE = "C:/java/jdk-17.0.0.1/bin/java.exe"; // <<= 사용자님의 실제 JDK 17 경로!
// ------------------------------------

const JOBS_QUEUE_DIR = path.join(__dirname, 'jobs_queue_files');
const JOB_STATUSES_FILE = path.join(__dirname, 'job_statuses_store.json'); // server.js와 동일한 경로
const POLLING_INTERVAL_MS = 3000; // 이전 5000ms에서 3000ms로 변경 (테스트용)

// --- Helper function to manage job statuses (server.js와 동일한 로직이어야 함) ---
function readAllJobStatusesFromFile() {
    try {
        if (fs.existsSync(JOB_STATUSES_FILE)) {
            const fileContent = fs.readFileSync(JOB_STATUSES_FILE, 'utf-8');
            // 파일이 비어있거나 공백만 있는 경우 빈 객체 반환
            if (fileContent.trim() === '') {
                return {};
            }
            return JSON.parse(fileContent);
        }
    } catch (e) {
        console.error("[Worker] Error reading or parsing job_statuses_store.json:", e);
        // 오류 발생 시 안전하게 빈 객체 반환하여 TypeError 방지
    }
    return {}; // 파일이 없거나 읽기/파싱 오류 시 빈 객체 반환
}

function writeAllJobStatusesToFile(statuses) {
    try {
        fs.writeFileSync(JOB_STATUSES_FILE, JSON.stringify(statuses, null, 2), 'utf-8');
    } catch (e) {
        console.error("[Worker] Error writing job_statuses_store.json:", e);
    }
}
// --------------------------------------------------------------------


async function processActualJob(jobFilePath) {
    console.log(`[Worker] Attempting to process job file: ${jobFilePath}`);
    let jobDataFromFile;
    try {
        const fileContent = fs.readFileSync(jobFilePath, 'utf-8');
        jobDataFromFile = JSON.parse(fileContent);
    } catch (e) {
        console.error(`[Worker] Failed to read or parse job file ${jobFilePath}:`, e);
        // 문제가 있는 작업 파일은 다른 곳으로 옮기거나 이름 변경하여 무한 루프 방지
        try {
            if (fs.existsSync(jobFilePath)) {
                fs.renameSync(jobFilePath, `${jobFilePath}.error-${Date.now()}`);
                console.log(`[Worker] Moved problematic job file to: ${jobFilePath}.error-${Date.now()}`);
            }
        } catch (renameError) {
            console.error(`[Worker] Could not rename problematic job file ${jobFilePath}:`, renameError);
        }
        return; // 이 작업은 더 이상 처리하지 않음
    }

    const { id: jobId, zipFilePath, outputJsonPath, originalFileName, userId } = jobDataFromFile;

    // [수정] jobId가 유효한지 먼저 확인
    if (!jobId) {
        console.error(`[Worker] Job ID is missing in job file: ${jobFilePath}. Discarding.`);
        if (fs.existsSync(jobFilePath)) fs.unlinkSync(jobFilePath); // 잘못된 작업 파일 삭제
        return;
    }

    console.log(`[Worker] Processing job ${jobId} for user: ${userId}, file: ${originalFileName}`);
    console.log(`[Worker] Output will be saved to: ${outputJsonPath}`);

    // 상태 업데이트: 'processing'
    let statuses = readAllJobStatusesFromFile(); // 항상 객체를 반환하도록 수정됨
    // [수정] statuses[jobId]가 없을 경우를 대비하여 초기화
    if (!statuses[jobId]) {
        console.warn(`[Worker] Status for job ${jobId} not found in store, initializing.`);
        statuses[jobId] = { ...jobDataFromFile }; // 작업 파일 내용으로 초기화
    }
    statuses[jobId].status = 'processing';
    statuses[jobId].startedAt = new Date().toISOString();
    statuses[jobId].updatedAt = new Date().toISOString();
    // outputJsonPath는 jobDataFromFile에 이미 포함되어 있으므로, 중복 저장 불필요
    // statuses[jobId].outputJsonPathForWorker = outputJsonPath;
    writeAllJobStatusesToFile(statuses);

    try {
        await new Promise((resolve, reject) => {
            // outputJsonPath의 디렉토리가 존재하는지 확인 및 생성 (Java 프로세스 실행 전)
            const outputDir = path.dirname(outputJsonPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`[Worker][Job ${jobId}] Created output directory for results: ${outputDir}`);
            }

            const javaProcess = spawn(`"${JDK_JAVA_EXECUTABLE}"`, ['-jar', JAVA_ANALYZER_JAR_PATH, zipFilePath, outputJsonPath], { shell: true });
            let stderrOutput = '';
            let stdoutOutput = '';

            javaProcess.stdout.on('data', (data) => { stdoutOutput += data.toString(); });
            javaProcess.stderr.on('data', (data) => { stderrOutput += data.toString(); console.error(`[Worker][Job ${jobId}] Java stderr: ${data.toString().trim()}`); });

            javaProcess.on('close', (code) => {
                if (stdoutOutput.trim()) console.log(`[Worker][Job ${jobId}] Full Java stdout on close: ${stdoutOutput.trim()}`);

                if (fs.existsSync(zipFilePath)) {
                    fs.unlink(zipFilePath, (err) => {
                        if (err) console.error(`[Worker][Job ${jobId}] Error deleting uploaded zip ${zipFilePath}:`, err);
                        else console.log(`[Worker][Job ${jobId}] Deleted uploaded zip: ${zipFilePath}`);
                    });
                }

                statuses = readAllJobStatusesFromFile(); // 최신 상태 다시 읽기
                if (!statuses[jobId]) { // 이런 경우는 거의 없어야 함
                    console.error(`[Worker][Job ${jobId}] Status object disappeared after Java process! Re-initializing.`);
                    statuses[jobId] = { id: jobId, originalFileName: originalFileName };
                }

                if (code === 0 && fs.existsSync(outputJsonPath)) {
                    console.log(`[Worker][Job ${jobId}] Analysis successful. Output file created: ${outputJsonPath}`);
                    statuses[jobId].status = 'completed';
                    statuses[jobId].resultPath = outputJsonPath; // 실제 결과 파일 경로 저장
                } else {
                    const errorMsg = `Java process for job ${jobId} failed. Exit code: ${code}.`;
                    console.error(`[Worker][Job ${jobId}] ${errorMsg}`);
                    statuses[jobId].status = 'failed';
                    statuses[jobId].error = errorMsg;
                    statuses[jobId].details = stderrOutput.trim() || "No stderr output from Java process.";
                }
                statuses[jobId].finishedAt = new Date().toISOString();
                statuses[jobId].updatedAt = new Date().toISOString();
                writeAllJobStatusesToFile(statuses);
                resolve();
            });

            javaProcess.on('error', (err) => {
                if (fs.existsSync(zipFilePath)) fs.unlink(zipFilePath, () => {});
                console.error(`[Worker][Job ${jobId}] Failed to START Java process:`, err);
                statuses = readAllJobStatusesFromFile();
                if (!statuses[jobId]) statuses[jobId] = { id: jobId, originalFileName: originalFileName };
                statuses[jobId].status = 'failed';
                statuses[jobId].error = `Critical: Failed to start Java process - ${err.message}`;
                statuses[jobId].finishedAt = new Date().toISOString();
                statuses[jobId].updatedAt = new Date().toISOString();
                writeAllJobStatusesToFile(statuses);
                reject(err);
            });
        });

        // 성공/실패 무관하게 처리된 작업 파일 삭제
        if (fs.existsSync(jobFilePath)) {
            fs.unlinkSync(jobFilePath);
            console.log(`[Worker] Deleted processed job file: ${jobFilePath}`);
        }

    } catch (e) {
        console.error(`[Worker] Error during job ${jobId} processing (outer try-catch):`, e);
        statuses = readAllJobStatusesFromFile();
        if (statuses[jobId]) { // 상태 객체가 존재할 때만 업데이트 시도
            statuses[jobId].status = 'failed';
            statuses[jobId].error = e.message || "Unknown error in worker's job processing.";
            statuses[jobId].finishedAt = new Date().toISOString();
            statuses[jobId].updatedAt = new Date().toISOString();
            writeAllJobStatusesToFile(statuses);
        }
        if (fs.existsSync(jobFilePath)) { // 에러 발생 시에도 작업 파일 삭제 시도
            try { fs.unlinkSync(jobFilePath); } catch (delErr) { console.error(`[Worker] Error deleting job file ${jobFilePath} after outer error:`, delErr); }
        }
    }
}

let isCurrentlyCheckingJobs = false;

function checkForNewJobs() {
    if (isCurrentlyCheckingJobs) { return; }
    isCurrentlyCheckingJobs = true;

    fs.readdir(JOBS_QUEUE_DIR, (err, files) => {
        if (err) {
            console.error("[Worker] Failed to read jobs queue directory:", err);
            isCurrentlyCheckingJobs = false;
            return;
        }

        if (files.length > 0) {
            const jobFileToProcess = files.sort()[0]; // 가장 오래된 파일 (이름순)
            const fullJobFilePath = path.join(JOBS_QUEUE_DIR, jobFileToProcess);

            console.log(`[Worker] Found job file: ${jobFileToProcess}. Attempting to process.`);

            processActualJob(fullJobFilePath)
                .catch(processingError => { // processActualJob 내부의 Promise reject 처리
                    console.error(`[Worker] Unhandled promise rejection from processActualJob for ${jobFileToProcess}:`, processingError);
                })
                .finally(() => {
                    isCurrentlyCheckingJobs = false;
                    // 바로 다음 작업을 확인하거나, 인터벌에 맡김
                    if (files.length > 1) { // 처리 후에도 파일이 남아있으면 즉시 다음 것 확인
                        checkForNewJobs();
                    }
                });
        } else {
            isCurrentlyCheckingJobs = false;
        }
    });
}

// --- Worker 시작 ---
if (!fs.existsSync(JAVA_ANALYZER_JAR_PATH)) {
    console.error(`[Worker] CRITICAL: Analyzer JAR not found at: ${JAVA_ANALYZER_JAR_PATH}`);
    process.exit(1);
}
try {
    const javaVersionOutput = execSync(`"${JDK_JAVA_EXECUTABLE}" -version 2>&1`).toString();
    console.log(`[Worker] ACTUAL Java version used by executable:\n${javaVersionOutput}`);
} catch (e) {
    console.error(`[Worker] FAILED to get version from Java executable: "${JDK_JAVA_EXECUTABLE}". Error: ${e.message}`);
}

console.log('[Worker] Worker process started. Checking for jobs periodically...');
setInterval(checkForNewJobs, POLLING_INTERVAL_MS);
checkForNewJobs(); // 초기 실행 시 한번 확인
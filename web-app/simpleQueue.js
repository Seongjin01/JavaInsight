// web-app/simpleQueue.js
const { v4: uuidv4 } = require('uuid'); // 고유 ID 생성을 위해 (npm install uuid)
const PQueue = require('p-queue').default; // 동시성 제어를 위해 (npm install p-queue)

const jobQueue = []; // 작업 대기열 (실제로는 DB나 메시지 브로커 사용)
const jobStatuses = {}; // 작업 상태 및 결과 저장 (jobId: { status, data, resultPath, error, createdAt, updatedAt })

// 워커가 한 번에 처리할 작업 수 (동시성 제어)
// 환경 변수 또는 설정 파일에서 가져오는 것을 권장
const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '1', 10);
const internalProcessingQueue = new PQueue({ concurrency: concurrency });

let workerProcessFunction = null; // 외부에서 실제 작업 처리 함수를 등록

/**
 * 워커가 실제 작업을 처리하는 함수를 등록합니다.
 * @param {function} fn - 작업을 처리할 비동기 함수 (jobData를 인자로 받음)
 */
function setWorkerProcess(fn) {
    workerProcessFunction = fn;
    // 큐에 대기 중인 작업이 있다면 즉시 처리 시도 (워커 시작 시)
    triggerProcessing();
}

/**
 * 큐에서 다음 작업을 가져와 처리합니다.
 * PQueue를 사용하여 동시성을 제어합니다.
 */
async function triggerProcessing() {
    if (jobQueue.length > 0 && workerProcessFunction && internalProcessingQueue.size < internalProcessingQueue.concurrency) {
        const jobToProcess = jobQueue.shift(); // FIFO 방식으로 큐에서 작업 가져오기
        if (jobToProcess && jobStatuses[jobToProcess.id]) {
            jobStatuses[jobToProcess.id].status = 'processing';
            jobStatuses[jobToProcess.id].startedAt = new Date().toISOString();
            console.log(`[Queue] Job picked up: ${jobToProcess.id}, Concurrency: ${internalProcessingQueue.size}/${internalProcessingQueue.concurrency}`);

            internalProcessingQueue.add(async () => {
                try {
                    // 등록된 워커 로직 실행 (워커는 이 함수 내에서 storeJobResult를 호출해야 함)
                    await workerProcessFunction(jobToProcess.data, jobToProcess.id);
                    // 워커 함수 내부에서 storeJobResult를 통해 completed 또는 failed로 상태 변경
                } catch (error) {
                    console.error(`[Queue] Critical error in workerProcessFunction for job ${jobToProcess.id}:`, error);
                    storeJobResult(jobToProcess.id, null, error.message || 'Unhandled worker error');
                } finally {
                    // 다음 작업 처리 시도
                    triggerProcessing();
                }
            });

            // 더 많은 작업을 동시에 시작할 수 있는지 확인
            if (jobQueue.length > 0 && internalProcessingQueue.size < internalProcessingQueue.concurrency) {
                triggerProcessing(); // 즉시 다음 작업 처리 시도 (큐에 작업이 남아있다면)
            }
        }
    }
}

/**
 * 새로운 작업을 큐에 추가합니다.
 * @param {object} data - 작업에 필요한 데이터 (예: filePath, userId 등)
 * @returns {string} 생성된 작업 ID
 */
function addJob(data) {
    const jobId = uuidv4();
    const job = { id: jobId, data };
    jobQueue.push(job);
    jobStatuses[jobId] = {
        status: 'queued',
        id: jobId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataPreview: data.originalFileName || data.filePath, // 간단한 미리보기 정보
    };
    console.log(`[Queue] Job added: ${jobId} (${data.originalFileName || 'N/A'}), Queue size: ${jobQueue.length}`);
    triggerProcessing(); // 새 작업 추가 시 워커가 처리하도록 유도
    return jobId;
}

/**
 * 특정 작업의 현재 상태를 반환합니다.
 * @param {string} jobId - 작업 ID
 * @returns {object} 작업 상태 정보
 */
function getJobStatus(jobId) {
    const job = jobStatuses[jobId];
    if (!job) {
        return { id: jobId, status: 'not_found', error: 'Job ID not found.' };
    }
    // 결과 데이터는 보안상 또는 크기 문제로 상태 객체에 직접 포함하지 않을 수 있음
    // 여기서는 간단히 포함 (실제로는 resultPath만 제공하고, 별도 API로 결과 요청)
    const { resultData, ...statusWithoutResultData } = job;
    return statusWithoutResultData; // resultData를 제외한 상태 정보 반환
}

/**
 * 작업 결과를 저장하고 상태를 업데이트합니다 (워커가 호출).
 * @param {string} jobId - 작업 ID
 * @param {object|string} resultDataOrPath - 분석 결과 데이터 또는 결과 파일 경로
 * @param {string|Error} [error=null] - 오류 발생 시 오류 메시지 또는 Error 객체
 */
function storeJobResult(jobId, resultDataOrPath, error = null) {
    if (!jobStatuses[jobId]) {
        console.error(`[Queue] Attempted to store result for non-existent job: ${jobId}`);
        return;
    }
    const job = jobStatuses[jobId];
    job.updatedAt = new Date().toISOString();

    if (error) {
        job.status = 'failed';
        job.error = typeof error === 'string' ? error : (error.message || 'Unknown error');
        if (error.details) job.details = error.details; // 추가 에러 정보 (예: stderr)
        console.log(`[Queue] Job failed and result stored: ${jobId}`);
    } else {
        job.status = 'completed';
        if (typeof resultDataOrPath === 'string') {
            job.resultPath = resultDataOrPath; // 결과 파일 경로 저장
        } else {
            // job.resultData = resultDataOrPath; // 메모리에 직접 저장 (큰 데이터는 비권장)
            // 실제로는 S3 URL 이나 DB에 저장된 결과물의 ID를 저장
            job.resultReference = `See /api/results/${jobId}`; // 예시: 결과를 가져올 수 있는 참조
        }
        console.log(`[Queue] Job completed and result stored: ${jobId}`);
    }
}

/**
 * (구현 필요) 실제 분석 결과를 가져오는 함수
 * @param {string} jobId
 * @returns {object|null} 분석 결과 또는 null
 */
function getJobResultData(jobId) {
    const job = jobStatuses[jobId];
    if (job && job.status === 'completed') {
        // if (job.resultData) return job.resultData;
        if (job.resultPath) {
            // 예시: 파일 시스템에서 결과 읽기 (실제로는 DB나 S3 등에서 가져옴)
            // 여기서는 간단히 경로만 반환하거나, 실제 파일 내용을 읽어 반환해야 함
            // fs.readFileSync(job.resultPath, 'utf-8');
            return { message: "Result would be fetched from path", path: job.resultPath };
        }
        return { message: "Result data (if stored directly) or reference found." };
    }
    return null;
}


module.exports = {
    addJob,
    getJobStatus,
    setWorkerProcess,
    storeJobResult,
    getJobResultData, // 결과 데이터 조회를 위해 추가
};
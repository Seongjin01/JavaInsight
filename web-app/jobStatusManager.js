// web-app/jobStatusManager.js
const fs = require('fs');
const path = require('path');

const JOB_STATUS_FILE_PATH = path.join(__dirname, 'job_statuses.json');

/**
 * 작업 상태 파일을 읽어 객체로 반환합니다.
 * 파일이 없거나 유효하지 않은 JSON이면 빈 객체를 반환합니다.
 * @returns {object} 작업 상태 객체
 */
function readJobStatuses() {
    try {
        if (fs.existsSync(JOB_STATUS_FILE_PATH)) {
            const fileContent = fs.readFileSync(JOB_STATUS_FILE_PATH, 'utf-8');
            if (fileContent.trim() === '') { // 파일이 비어있을 경우
                return {};
            }
            return JSON.parse(fileContent);
        }
    } catch (error) {
        console.error("[JobStatusManager] Error reading or parsing job_statuses.json:", error);
        // 오류 발생 시 안전하게 빈 객체 반환 또는 백업 파일 사용 등의 로직 추가 가능
    }
    return {}; // 파일이 없거나 오류 발생 시 빈 객체 반환
}

/**
 * 작업 상태 객체를 파일에 씁니다.
 * @param {object} statuses - 저장할 작업 상태 객체
 */
function writeJobStatuses(statuses) {
    try {
        fs.writeFileSync(JOB_STATUS_FILE_PATH, JSON.stringify(statuses, null, 2), 'utf-8');
    } catch (error) {
        console.error("[JobStatusManager] Error writing job_statuses.json:", error);
    }
}

/**
 * 특정 작업의 상태를 업데이트합니다.
 * @param {string} jobId - 작업 ID
 * @param {object} newStatusData - 새로운 상태 데이터 (기존 데이터에 병합됨)
 */
function updateJobStatus(jobId, newStatusData) {
    const statuses = readJobStatuses();
    statuses[jobId] = {
        ...(statuses[jobId] || {}), // 기존 상태가 있다면 유지, 없다면 빈 객체로 시작
        ...newStatusData,          // 새로운 데이터로 덮어쓰거나 추가
        id: jobId,                 // jobId는 항상 유지
        updatedAt: new Date().toISOString()
    };
    writeJobStatuses(statuses);
    console.log(`[JobStatusManager] Status updated for job ${jobId}: ${newStatusData.status || statuses[jobId].status}`);
}

/**
 * 특정 작업의 상태 정보를 가져옵니다.
 * @param {string} jobId - 작업 ID
 * @returns {object|null} 작업 상태 정보 또는 null (없을 경우)
 */
function getJobStatus(jobId) {
    const statuses = readJobStatuses();
    const jobInfo = statuses[jobId];
    if (!jobInfo) {
        // jobs_queue (파일 기반 큐)에 파일이 있는지 확인하여 'queued' 상태로 간주하는 로직은
        // server.js의 API 핸들러에서 별도로 처리하는 것이 역할 분리상 더 명확할 수 있음.
        // 여기서는 job_statuses.json에 없으면 단순히 null 반환.
        return null;
    }
    // 실제 결과 데이터는 포함하지 않음 (resultPath만 제공)
    const { resultData, ...statusToSend } = jobInfo;
    return statusToSend;
}


module.exports = {
    updateJobStatus,
    getJobStatus,
    // readJobStatuses, writeJobStatuses // 내부적으로만 사용, 직접 노출 불필요할 수 있음
};
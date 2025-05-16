// web-app/server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
// jobStatusManager.js를 사용하는 대신, 직접 파일 기반 상태 관리를 한다고 가정하고 진행합니다.
// 만약 jobStatusManager.js를 사용하고 있다면, 이 파일과 worker.js에서 해당 모듈을 require해야 합니다.

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const resultsBaseDir = path.join(__dirname, 'analysis_results');
if (!fs.existsSync(resultsBaseDir)) fs.mkdirSync(resultsBaseDir, { recursive: true });

const JOBS_QUEUE_DIR = path.join(__dirname, 'jobs_queue_files');
if (!fs.existsSync(JOBS_QUEUE_DIR)) fs.mkdirSync(JOBS_QUEUE_DIR, { recursive: true });

// [수정] JOB_STATUS_FILE 상수 선언 추가
const JOB_STATUSES_FILE = path.join(__dirname, 'job_statuses_store.json');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${path.parse(file.originalname).name}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.zip') {
            return cb(new Error('Only .zip files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

// --- Helper function to manage job statuses in a file ---
function readAllJobStatusesFromFile() {
    try {
        if (fs.existsSync(JOB_STATUSES_FILE)) { // [수정] 상수명 변경 JOB_STATUS_FILE -> JOB_STATUSES_FILE
            const fileContent = fs.readFileSync(JOB_STATUSES_FILE, 'utf-8');
            return fileContent ? JSON.parse(fileContent) : {};
        }
    } catch (e) { console.error("[API Server] Error reading job_statuses_store.json:", e); }
    return {};
}

function writeAllJobStatusesToFile(statuses) {
    try {
        fs.writeFileSync(JOB_STATUSES_FILE, JSON.stringify(statuses, null, 2), 'utf-8'); // [수정] 상수명 변경
    } catch (e) { console.error("[API Server] Error writing job_statuses_store.json:", e); }
}
// ---------------------------------------------------------

app.post('/api/analyze', upload.single('zipFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const jobId = uuidv4();
    const zipFilePath = req.file.path;
    const originalFileName = req.file.originalname;
    const userId = 'temp-user-id';

    const jobResultDir = path.join(resultsBaseDir, jobId);
    if (!fs.existsSync(jobResultDir)) fs.mkdirSync(jobResultDir, { recursive: true });
    const outputJsonPathForWorker = path.join(jobResultDir, 'analysis_output.json');

    const jobDataForFile = {
        id: jobId,
        zipFilePath: zipFilePath,
        originalFileName: originalFileName,
        outputJsonPath: outputJsonPathForWorker,
        userId: userId,
        // status: 'queued', // 상태는 아래에서 별도 파일에 기록
        createdAt: new Date().toISOString()
    };

    // job_statuses_store.json 에 초기 상태 기록
    const allStatuses = readAllJobStatusesFromFile();
    allStatuses[jobId] = {
        id: jobId,
        status: 'queued',
        originalFileName: originalFileName,
        createdAt: jobDataForFile.createdAt,
        updatedAt: jobDataForFile.createdAt,
        outputJsonPathForWorker: outputJsonPathForWorker // 워커가 사용할 결과 경로도 저장
    };
    writeAllJobStatusesToFile(allStatuses);

    const jobTaskFilePath = path.join(JOBS_QUEUE_DIR, `${jobId}.json`);
    fs.writeFile(jobTaskFilePath, JSON.stringify(jobDataForFile, null, 2), (err) => {
        if (err) {
            console.error(`[API Server] Failed to write job task file for ${jobId}:`, err);
            if (fs.existsSync(zipFilePath)) fs.unlink(zipFilePath, () => {});
            // 상태 파일에서 해당 작업 항목 제거 또는 'failed_to_queue'로 업데이트 (선택 사항)
            const currentStatuses = readAllJobStatusesFromFile();
            if (currentStatuses[jobId]) {
                currentStatuses[jobId].status = 'failed_to_queue';
                currentStatuses[jobId].error = 'Failed to write job task file.';
                currentStatuses[jobId].updatedAt = new Date().toISOString();
                writeAllJobStatusesToFile(currentStatuses);
            }
            return res.status(500).json({ error: 'Failed to queue analysis job.' });
        }
        console.log(`[API Server] Job task file created: ${jobTaskFilePath} for ${originalFileName}`);
        res.status(202).json({
            message: 'Analysis request accepted. Will be processed shortly.',
            jobId: jobId,
            statusUrl: `/api/analysis-status/${jobId}`
        });
    });
});

app.get('/api/analysis-status/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const allStatuses = readAllJobStatusesFromFile();
    const jobInfo = allStatuses[jobId];

    if (!jobInfo) {
        const jobTaskFilePath = path.join(JOBS_QUEUE_DIR, `${jobId}.json`);
        if (fs.existsSync(jobTaskFilePath)) {
            return res.json({ id: jobId, status: 'queued', message: 'Job is in queue, waiting for worker to pick up.' });
        }
        return res.status(404).json({ error: 'Job not found.' });
    }
    // resultPath는 실제 결과 데이터가 아니므로 상태 정보에 포함해도 괜찮음
    res.json(jobInfo);
});

app.get('/api/results/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const allStatuses = readAllJobStatusesFromFile();
    const jobInfo = allStatuses[jobId];

    if (!jobInfo || jobInfo.status !== 'completed') {
        return res.status(400).json({
            error: `Job ${jobId} not completed. Status: ${jobInfo?.status || 'unknown'}`,
            status: jobInfo?.status,
            details: jobInfo?.error
        });
    }

    const resultPath = jobInfo.outputJsonPathForWorker; // 워커가 결과를 저장한 경로
    if (resultPath && fs.existsSync(resultPath)) {
        fs.readFile(resultPath, 'utf8', (err, data) => {
            if (err) {
                console.error(`[API Server] Error reading result file for job ${jobId}:`, err);
                return res.status(500).json({ error: 'Failed to read analysis result file.' });
            }
            try {
                res.json(JSON.parse(data));
            } catch (parseError) {
                console.error(`[API Server] Error parsing result JSON for job ${jobId}:`, parseError);
                res.status(500).json({ error: 'Failed to parse result data.' });
            }
        });
    } else {
        console.error(`[API Server] Result file path not found or invalid for completed job ${jobId}. Path from status: ${resultPath}`);
        res.status(404).json({ error: 'Analysis result file not found for completed job.' });
    }
});

// React 정적 파일 서비스
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`API Server (server.js) running on http://localhost:${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
    console.log(`Analysis results base directory: ${resultsBaseDir}`);
    console.log(`Job queue directory (files): ${JOBS_QUEUE_DIR}`);
    // [수정] 로그 메시지에 정확한 상수명 사용
    console.log(`Job statuses file: ${JOB_STATUSES_FILE}`);
});
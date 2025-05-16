// web-app/server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const simpleQueue = require('./simpleQueue'); // 수정된 큐 모듈 임포트

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // JSON 요청 본문 파싱

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 분석 결과를 저장할 디렉토리 (워커와 공유되어야 함 - 실제로는 S3 등 사용)
const resultsBaseDir = path.join(__dirname, 'analysis_results');
if (!fs.existsSync(resultsBaseDir)) {
    fs.mkdirSync(resultsBaseDir, { recursive: true });
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 각 업로드마다 고유한 디렉토리 생성 (선택 사항, 보안 및 정리 용이)
        // const uploadSessionDir = path.join(uploadsDir, uuidv4());
        // if (!fs.existsSync(uploadSessionDir)) fs.mkdirSync(uploadSessionDir, { recursive: true });
        // cb(null, uploadSessionDir);
        cb(null, uploadsDir); // 간단하게 uploads 폴더에 바로 저장
    },
    filename: (req, file, cb) => {
        // 고유한 파일명 생성 (예: 원래이름-타임스탬프.zip)
        cb(null, `${path.parse(file.originalname).name}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.zip') {
            return cb(new Error('Only .zip files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB 파일 사이즈 제한
});

// API 엔드포인트: 분석 요청
app.post('/api/analyze', upload.single('zipFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
    }

    const zipFilePath = req.file.path; // multer가 저장한 파일 경로
    const originalFileName = req.file.originalname;

    // TODO: 사용자 인증이 있다면 userId 등을 jobData에 포함
    const userId = 'temp-user-id'; // 임시 사용자 ID

    // 분석 결과를 저장할 이 작업만의 고유 디렉토리 경로 생성
    const jobResultDir = path.join(resultsBaseDir, uuidv4()); // uuidv4 임포트 필요 또는 jobId 사용
    if (!fs.existsSync(jobResultDir)) {
        fs.mkdirSync(jobResultDir, { recursive: true });
    }
    const outputJsonPath = path.join(jobResultDir, 'analysis_output.json');


    const jobData = {
        zipFilePath: zipFilePath,         // 워커가 접근할 ZIP 파일 경로
        originalFileName: originalFileName, // 원본 파일명 (로깅 또는 정리용)
        outputJsonPath: outputJsonPath,   // 워커가 분석 결과를 저장할 경로
        userId: userId,
        // 기타 필요한 정보 (예: 분석 옵션, 사용자 플랜 등)
    };

    // 작업을 큐에 추가하고 작업 ID를 받음
    const jobId = simpleQueue.addJob(jobData);

    console.log(`[API Server] Analysis job ${jobId} queued for file ${originalFileName}`);

    res.status(202).json({ // 202 Accepted: 요청이 접수되었고 비동기 처리될 것임
        message: 'Analysis request accepted and queued. Check status endpoint for progress.',
        jobId: jobId,
        statusUrl: `/api/analysis-status/${jobId}` // 상태 조회 URL
    });
});

// API 엔드포인트: 분석 상태 조회
app.get('/api/analysis-status/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const statusInfo = simpleQueue.getJobStatus(jobId);

    if (statusInfo.status === 'not_found') {
        return res.status(404).json({ error: 'Job not found or already processed and cleaned.' });
    }
    res.json(statusInfo);
});

// API 엔드포인트: 분석 결과 조회 (상태가 'completed'일 때 호출)
app.get('/api/results/:jobId', (req, res) => {
    const jobId = req.params.jobId;
    const jobInfo = simpleQueue.getJobStatus(jobId); // 먼저 상태를 가져옴

    if (jobInfo.status !== 'completed') {
        return res.status(400).json({ error: `Job ${jobId} is not completed. Current status: ${jobInfo.status}`, status: jobInfo.status });
    }

    // simpleQueue에서 결과 경로(resultPath)를 가져와 파일 읽기
    // 또는 getJobResultData 함수를 사용하여 결과 직접 가져오기 (simpleQueue.js에 구현 필요)
    const resultPath = jobInfo.resultPath; // simpleQueue.storeJobResult에서 resultPath로 저장했다고 가정
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
        // 결과 데이터가 jobStatuses 객체에 직접 저장된 경우 (simpleQueue.js의 storeJobResult 구현에 따라 다름)
        // const resultData = simpleQueue.getJobResultData(jobId);
        // if(resultData) { res.json(resultData); } else ...
        res.status(404).json({ error: 'Analysis result data or file not found for completed job.' });
    }
});


// React 정적 파일 서비스 (프로덕션 빌드 시)
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`API Server (server.js) running on http://localhost:${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
    console.log(`Analysis results base directory: ${resultsBaseDir}`);
});
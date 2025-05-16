// web-app/worker.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const simpleQueue = require('./simpleQueue'); // 인메모리 큐 모듈 임포트

// 워커 설정
const JAVA_ANALYZER_JAR_PATH = path.resolve(__dirname, '..', 'java-analyzer', 'target', 'java-analyzer-1.0-SNAPSHOT-standalone.jar');
// 시스템에 설치된 Java 11+ 경로 또는 환경 변수 사용
const JDK_JAVA_EXECUTABLE = process.env.JDK11_HOME ? `${process.env.JDK11_HOME}/bin/java` : (process.env.JAVA_HOME ? `${process.env.JAVA_HOME}/bin/java` : 'java');

if (!fs.existsSync(JAVA_ANALYZER_JAR_PATH)) {
    console.error(`[Worker] CRITICAL: Analyzer JAR not found at: ${JAVA_ANALYZER_JAR_PATH}`);
    console.error('[Worker] Please build the java-analyzer project first (mvn clean package).');
    process.exit(1); // 워커 실행 중지
}

console.log(`[Worker] Using Java executable: ${JDK_JAVA_EXECUTABLE}`);
console.log(`[Worker] Using Analyzer JAR: ${JAVA_ANALYZER_JAR_PATH}`);


/**
 * 실제 분석 작업을 수행하는 함수
 * @param {object} jobData - 큐에서 받은 작업 데이터 (filePath, outputJsonPath 등 포함)
 * @param {string} jobId - 현재 처리 중인 작업의 ID
 */
async function processJavaAnalysis(jobData, jobId) {
    const { zipFilePath, outputJsonPath, originalFileName } = jobData; // outputJsonPath는 워커가 결과를 저장할 경로

    console.log(`[Worker] Starting analysis for job ${jobId}, file: ${originalFileName || zipFilePath}`);

    return new Promise((resolve, reject) => {
        // Java 프로세스 실행 (결과를 outputJsonPath 파일로 저장하도록 Java Main 클래스 수정 필요)
        // 또는, Java Main이 stdout으로 JSON을 출력하면 여기서 받아서 파일로 저장
        // 현재 Java Main은 두 번째 인자로 output 파일 경로를 받음
        const javaProcess = spawn(JDK_JAVA_EXECUTABLE, ['-jar', JAVA_ANALYZER_JAR_PATH, zipFilePath, outputJsonPath]);

        let stdoutData = '';
        let stderrData = '';

        javaProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            console.log(`[Worker][Job ${jobId}] Java stdout: ${data.toString().trim()}`);
        });

        javaProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            console.error(`[Worker][Job ${jobId}] Java stderr: ${data.toString().trim()}`);
        });

        javaProcess.on('close', (code) => {
            // 분석 후 업로드된 원본 ZIP 파일 삭제 (API 서버가 아닌 워커가 실제 사용 후 삭제)
            if (fs.existsSync(zipFilePath)) {
                fs.unlink(zipFilePath, (err) => {
                    if (err) console.error(`[Worker][Job ${jobId}] Error deleting uploaded zip ${zipFilePath}:`, err);
                    else console.log(`[Worker][Job ${jobId}] Deleted uploaded zip: ${zipFilePath}`);
                });
            }

            if (code === 0) {
                // Java 프로세스가 성공적으로 종료되었고, outputJsonPath에 결과 파일이 생성되었다고 가정
                if (fs.existsSync(outputJsonPath)) {
                    console.log(`[Worker][Job ${jobId}] Analysis successful. Output at: ${outputJsonPath}`);
                    // simpleQueue에 결과 경로와 함께 성공 상태 저장
                    simpleQueue.storeJobResult(jobId, outputJsonPath);
                    resolve(outputJsonPath);
                } else {
                    const errorMsg = `Analysis completed (exit code 0) but output file not found: ${outputJsonPath}`;
                    console.error(`[Worker][Job ${jobId}] ${errorMsg}`);
                    simpleQueue.storeJobResult(jobId, null, { message: errorMsg, details: stderrData });
                    reject(new Error(errorMsg));
                }
            } else {
                const errorMsg = `Java process for job ${jobId} exited with code ${code}.`;
                console.error(`[Worker][Job ${jobId}] ${errorMsg}`);
                // outputJsonPath에 부분적인 결과나 에러 로그가 있을 수 있으나, 여기서는 일단 실패로 간주
                // 필요시 stderrData를 에러 상세 정보로 저장
                simpleQueue.storeJobResult(jobId, null, { message: errorMsg, details: stderrData });
                reject(new Error(errorMsg));
            }
        });

        javaProcess.on('error', (err) => { // spawn 자체 에러 (예: java 명령어 못 찾음)
            console.error(`[Worker][Job ${jobId}] Failed to start Java process:`, err);
            if (fs.existsSync(zipFilePath)) { // 에러 시에도 파일 삭제 시도
                fs.unlink(zipFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error(`[Worker][Job ${jobId}] Error deleting zip on process start error:`, unlinkErr);
                });
            }
            simpleQueue.storeJobResult(jobId, null, { message: `Failed to start Java process: ${err.message}` });
            reject(err);
        });
    });
}

// simpleQueue에 워커 처리 함수 등록
simpleQueue.setWorkerProcess(processJavaAnalysis);

console.log('[Worker] Worker process started. Waiting for jobs...');
// 실제 메시지 큐 시스템에서는 여기서 listening 로직이 들어감 (예: queue.process(...))
// simpleQueue.js의 triggerProcessing()이 이 역할을 대신 함
import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Button, message, Typography, Spin, Alert, Progress, theme as antdTheme } from 'antd';
import { InboxOutlined, SendOutlined, FileZipOutlined, CheckCircleTwoTone, CloseCircleTwoTone, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { analyzeJavaProject, getAnalysisStatus, getAnalysisResult } from '../services/api'; // api.js에서 API 함수 임포트

const { Dragger } = Upload;
const { Title, Paragraph } = Typography;

const POLLING_INTERVAL = 3000; // 상태 폴링 간격 (3초)

const FileUploaderPage = ({ setAnalysisResult, setIsLoading: setGlobalLoading, setError: setGlobalError }) => {
    const [fileList, setFileList] = useState([]);
    const [isUploadingAndProcessing, setIsUploadingAndProcessing] = useState(false); // 업로드 시작부터 분석 완료/실패까지의 전체 로딩 상태
    const [currentJobId, setCurrentJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null); // 'queued', 'processing', 'completed', 'failed', 'error_polling'
    const [progressPercent, setProgressPercent] = useState(0); // 간단한 시각적 진행률
    const [localError, setLocalError] = useState(null); // 이 페이지 내의 작업 관련 에러 메시지
    const navigate = useNavigate();
    const { token } = antdTheme.useToken(); // App.js의 ConfigProvider로부터 테마 토큰 가져오기

    // Dragger 설정 (파일 선택 관련 로직)
    const draggerProps = {
        name: 'zipFile', // server.js의 multer 설정과 일치해야 함
        multiple: false,
        accept: ".zip,application/zip,application/x-zip-compressed", // 허용 파일 타입
        fileList: fileList,
        onRemove: () => { // 파일 제거 시 초기화
            setFileList([]);
            setLocalError(null); // 로컬 에러도 초기화
            if (currentJobId || isUploadingAndProcessing) { // 진행 중이던 작업이 있다면 초기화
                setIsUploadingAndProcessing(false);
                setCurrentJobId(null);
                setJobStatus(null);
                setProgressPercent(0);
                message.destroy('analysisProgress'); // 진행 중이던 로딩 메시지 닫기
            }
            return true;
        },
        beforeUpload: (file) => { // 업로드 전 파일 유효성 검사
            if (isUploadingAndProcessing) { // 이전 작업 진행 중이면 새 파일 선택 방지
                message.warning('A previous analysis is still in progress. Please wait.', 5);
                return Upload.LIST_IGNORE;
            }

            const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.toLowerCase().endsWith('.zip');
            if (!isZip) {
                const errorMsg = `${file.name} is not a valid ZIP file.`;
                message.error(errorMsg, 5);
                setLocalError(errorMsg);
                return Upload.LIST_IGNORE;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB 크기 제한 예시
                const errorMsg = `${file.name} is too large (max 10MB).`;
                message.error(errorMsg, 5);
                setLocalError(errorMsg);
                return Upload.LIST_IGNORE;
            }
            setFileList([file]); // 유효한 파일이면 fileList 상태 업데이트
            setLocalError(null); // 이전 에러 메시지 초기화
            return false; // Ant Design의 자동 업로드를 막고 수동으로 처리
        },
    };

    // 작업 상태를 주기적으로 폴링하는 함수
    const pollJobStatus = useCallback(async (jobId) => {
        if (!jobId || !isUploadingAndProcessing) { // jobId가 없거나, 전체 처리 상태가 아니라면 폴링 중단
             if (isUploadingAndProcessing) setIsUploadingAndProcessing(false);
             message.destroy('analysisProgress');
             return;
        }

        try {
            console.log(`[Polling] Checking status for job: ${jobId}, Current UI status: ${jobStatus}`);
            const response = await getAnalysisStatus(jobId); // API 호출
            const statusData = response.data;

            if (!statusData || !statusData.status) {
                console.warn(`[Polling] Invalid status data received for job ${jobId}:`, statusData);
                setJobStatus('error_polling'); // 폴링 중 응답 오류 상태
                return;
            }

            setJobStatus(statusData.status); // 실제 백엔드 상태로 UI 상태 업데이트

            if (statusData.status === 'completed') {
                setProgressPercent(100);
                message.destroy('analysisProgress');
                message.success(<><CheckCircleTwoTone twoToneColor={token.colorSuccess} /> Analysis complete! Fetching results...</>, 2);

                const resultResponse = await getAnalysisResult(jobId);
                setAnalysisResult(resultResponse.data); // App.js의 전역 상태 업데이트
                setGlobalLoading(false); // 전역 로딩 상태 해제
                setIsUploadingAndProcessing(false); // 이 페이지의 로딩 상태 해제
                setCurrentJobId(null); // 현재 작업 ID 초기화
                setJobStatus(null);    // 작업 상태 초기화
                setFileList([]);       // 업로드 파일 목록 초기화
                navigate('/results');  // 결과 페이지로 이동
            } else if (statusData.status === 'failed') {
                message.destroy('analysisProgress');
                const errorDetail = statusData.error || (statusData.details ? (typeof statusData.details === 'string' ? statusData.details : JSON.stringify(statusData.details)) : 'Unknown analysis error.');
                const displayError = errorDetail.length > 200 ? errorDetail.substring(0, 200) + '...' : errorDetail;
                message.error(<><CloseCircleTwoTone twoToneColor={token.colorError} /> Analysis failed. {displayError}</>, 10);
                setLocalError(`Analysis failed: ${errorDetail}`);
                setGlobalError(`Analysis failed: ${errorDetail}`); // App.js의 전역 에러 상태 업데이트
                setGlobalLoading(false);
                setIsUploadingAndProcessing(false);
                setCurrentJobId(null);
                // 실패 시 jobStatus를 'failed'로 유지하여 사용자에게 실패했음을 명시적으로 보여줄 수 있음
            } else if (statusData.status === 'processing') {
                setProgressPercent(prev => (prev < 70 ? prev + 20 : (prev < 95 ? prev + 5 : prev)));
            } else if (statusData.status === 'queued') {
                setProgressPercent(prev => (prev < 20 ? prev + 5 : prev));
            }
        } catch (err) {
            console.error('[Polling] Error fetching job status:', err);
            let errorMsg = "Error checking analysis status. Please try re-uploading.";
            if (err.response && err.response.data && err.response.data.error) {
                 errorMsg = err.response.data.error;
            } else if (err.message) {
                errorMsg = err.message;
            }
            // 지속적인 폴링 에러가 발생하면 로딩 상태를 해제하고 사용자에게 알림
            setLocalError(errorMsg);
            setGlobalError(errorMsg);
            setIsUploadingAndProcessing(false);
            setGlobalLoading(false);
            message.destroy('analysisProgress');
            message.error(<><CloseCircleTwoTone twoToneColor={token.colorError} /> {errorMsg}</>, 7);
            setCurrentJobId(null); // 폴링 중단
            setJobStatus('error_polling');
        }
    }, [navigate, setAnalysisResult, setGlobalLoading, setGlobalError, token, isUploadingAndProcessing, jobStatus]); // jobStatus도 의존성에 추가하여 상태 변경 시 폴링 로직 재평가


    // currentJobId와 isUploadingAndProcessing 상태에 따라 폴링 시작/중지
    useEffect(() => {
        let intervalId = null;

        if (currentJobId && isUploadingAndProcessing && (jobStatus === 'queued' || jobStatus === 'processing')) {
            // 첫 상태 확인은 즉시 (handleUpload에서 queued로 설정 후 바로 시작 가능)
            pollJobStatus(currentJobId); // 즉시 한번 호출
            intervalId = setInterval(() => {
                pollJobStatus(currentJobId);
            }, POLLING_INTERVAL);
            console.log(`[Polling] Interval started for job: ${currentJobId}, interval: ${POLLING_INTERVAL}ms, current UI status: ${jobStatus}`);
        }

        // 컴포넌트 unmount 시 또는 폴링 조건이 더 이상 충족되지 않을 때 인터벌 정리
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
                console.log(`[Polling] Interval stopped for job: ${currentJobId || 'N/A'}`);
                message.destroy('analysisProgress'); // 컴포넌트 unmount 시 로딩 메시지 제거
            }
        };
    }, [currentJobId, isUploadingAndProcessing, jobStatus, pollJobStatus]);


    // 파일 업로드 및 분석 요청 처리 함수
    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning('Please select a ZIP file to upload.', 5);
            setLocalError('Please select a ZIP file to upload.');
            return;
        }

        // 이전 작업 관련 상태 초기화
        setIsUploadingAndProcessing(true);
        setLocalError(null);
        setGlobalLoading(true);
        setGlobalError(null);
        setAnalysisResult(null);
        setCurrentJobId(null);
        setJobStatus(null);
        setProgressPercent(0);
        message.destroy('analysisProgress'); // 이전 메시지가 있다면 닫고 시작

        try {
            // 서버에 분석 요청
            const response = await analyzeJavaProject(fileList[0]);
            const { jobId, message: serverMessage } = response.data;

            if (jobId) {
                // Ant Design의 message.loading은 key를 주어 수동으로 닫거나, duration을 0으로 하여 자동으로 닫히지 않게 할 수 있음
                message.loading({
                    content: <><ClockCircleOutlined /> {serverMessage || 'Analysis request submitted. Processing...'}</>,
                    key: 'analysisProgress', // 이 key를 사용하여 message.destroy로 닫음
                    duration: 0 // 자동으로 닫히지 않음
                });
                setCurrentJobId(jobId); // 상태에 jobId 저장 -> useEffect가 폴링 시작
                setJobStatus('queued');   // 초기 작업 상태 'queued'로 설정
                setProgressPercent(5);    // 업로드 및 큐 등록 완료 시 약간의 진행률 표시
            } else {
                // 서버가 jobId를 반환하지 않은 경우 (예상치 못한 응답)
                throw new Error(serverMessage || "Failed to submit analysis job. No Job ID received.");
            }
        } catch (err) {
            // 파일 업로드 또는 초기 요청 자체에서 실패한 경우
            let errorMsg = 'An unknown error occurred during analysis submission.';
            if (err.response && err.response.data && err.response.data.error) {
                errorMsg = err.response.data.error;
                if(err.response.data.details) errorMsg += `: ${err.response.data.details}`;
            } else if (err.message) {
                errorMsg = err.message;
            }
            console.error('Upload/Analysis submission exception:', err);
            setLocalError(errorMsg);
            setGlobalError(errorMsg); // App.js의 에러 상태 업데이트
            message.destroy('analysisProgress'); // 로딩 메시지 닫기
            message.error(<><CloseCircleTwoTone twoToneColor={token.colorError} /> {errorMsg}</>, 7);
            setIsUploadingAndProcessing(false); // 로딩 상태 해제
            setGlobalLoading(false); // App.js의 로딩 상태 해제
        }
    };

    return (
        <div className="file-uploader-page-content">
            <div className="file-uploader-container">
                <Title level={2} style={{ textAlign: 'center', marginBottom: '10px', color: token.colorTextBase }}>
                    <FileZipOutlined style={{ marginRight: '10px', color: token.colorPrimary }} />
                    Java Code Insight
                </Title>
                <Paragraph style={{ textAlign: 'center', color: token.colorTextSecondary, marginBottom: '30px', fontSize: '16px' }}>
                    Upload your Java project (ZIP archive) for detailed structural analysis.
                </Paragraph>

                {isUploadingAndProcessing && (
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <Spin size="large" tip={
                            jobStatus === 'completed' ? "Analysis Complete! Fetching results..." :
                            jobStatus === 'processing' ? `Analyzing... (Job ID: ${currentJobId ? currentJobId.substring(0,8) : ''}...)` :
                            jobStatus === 'queued' ? `Waiting in queue... (Job ID: ${currentJobId ? currentJobId.substring(0,8) : ''}...)` :
                            jobStatus === 'error_polling' ? "Error checking status..." :
                            "Submitting analysis job..."
                        } />
                        {currentJobId && (jobStatus === 'queued' || jobStatus === 'processing' || jobStatus === 'completed') && (
                            <Progress
                                percent={progressPercent}
                                status={jobStatus === 'failed' || jobStatus === 'error_polling' ? 'exception' : (jobStatus === 'completed' ? 'success' : 'active')}
                                strokeColor={jobStatus === 'failed' || jobStatus === 'error_polling' ? token.colorError : token.colorPrimary}
                                style={{marginTop: '15px'}}
                            />
                        )}
                    </div>
                )}

                {localError && !isUploadingAndProcessing && (
                    <Alert
                        message="Analysis Problem"
                        description={localError}
                        type="error"
                        showIcon
                        closable // 사용자가 직접 닫을 수 있도록
                        onClose={() => setLocalError(null)} // 닫기 버튼 클릭 시 에러 메시지 초기화
                        style={{ marginBottom: '20px' }}
                    />
                )}

                <Dragger {...draggerProps} disabled={isUploadingAndProcessing} className="custom-dragger">
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined /> {/* 아이콘 색상은 CSS 또는 ConfigProvider 테마에서 제어 */}
                    </p>
                    <p className="ant-upload-text" style={{ color: token.colorText }}>Click or drag .zip file to this area</p>
                    <p className="ant-upload-hint" style={{ color: token.colorTextSecondary }}>
                        Max file size: 10MB. Ensure all .java source files are included.
                    </p>
                </Dragger>

                <Button
                    type="primary" // ConfigProvider의 colorPrimary 자동 적용
                    icon={<SendOutlined />}
                    onClick={handleUpload}
                    disabled={fileList.length === 0 || isUploadingAndProcessing}
                    // 업로드 시작 시 버튼 로딩 (초기 작업 제출 중일 때)
                    loading={isUploadingAndProcessing && !currentJobId}
                    style={{ marginTop: 24, width: '100%' }}
                    size="large"
                >
                    {isUploadingAndProcessing ?
                        (jobStatus ? `Status: ${jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}` : 'Processing...') :
                        'Analyze Project'
                    }
                </Button>
            </div>
        </div>
    );
};

export default FileUploaderPage;
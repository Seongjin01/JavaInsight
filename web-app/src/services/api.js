// web-app/src/services/api.js
import axios from 'axios';

// Axios 인스턴스는 필요에 따라 baseURL, 기본 헤더 등을 설정할 수 있습니다.
// 개발 환경에서는 package.json의 proxy 설정을 사용하므로 baseURL이 필요 없을 수 있습니다.
const apiClient = axios.create({
    // baseURL: '/api', // 예시: 모든 요청이 /api 로 시작한다면
    // timeout: 10000, // 예시: 요청 타임아웃 설정
});

/**
 * Java 프로젝트 ZIP 파일을 업로드하여 분석을 요청하는 함수
 * @param {File} zipFile - 사용자가 업로드한 ZIP 파일 객체
 * @returns {Promise} - 서버 응답을 담은 Promise 객체 (jobId 등을 포함)
 */
export const analyzeJavaProject = (zipFile) => {
    const formData = new FormData();
    formData.append('zipFile', zipFile); // 'zipFile'은 server.js의 multer 설정과 일치해야 함

    return apiClient.post('/api/analyze', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

/**
 * 특정 분석 작업의 현재 상태를 조회하는 함수
 * @param {string} jobId - 조회할 작업의 ID
 * @returns {Promise} - 작업 상태 정보를 담은 Promise 객체
 */
export const getAnalysisStatus = (jobId) => {
    return apiClient.get(`/api/analysis-status/${jobId}`);
};

/**
 * 완료된 분석 작업의 결과를 가져오는 함수
 * @param {string} jobId - 결과를 가져올 작업의 ID
 * @returns {Promise} - 분석 결과 JSON을 담은 Promise 객체
 */
export const getAnalysisResult = (jobId) => {
    return apiClient.get(`/api/results/${jobId}`);
};

// 만약 다른 API 호출 함수가 있다면 여기에 추가합니다.
// export const someOtherApiCall = (params) => {
//     return apiClient.post('/api/some-other-endpoint', params);
// };
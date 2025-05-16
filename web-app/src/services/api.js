import axios from 'axios';

// Axios instance can be configured here (e.g., baseURL, headers)
const apiClient = axios.create({
    // baseURL: '/api', // Handled by proxy in package.json for development
    headers: {
        'Content-Type': 'multipart/form-data', // Default for file uploads, can be overridden
    },
});

export const analyzeJavaProject = (zipFile) => {
    const formData = new FormData();
    formData.append('zipFile', zipFile);

    return apiClient.post('/api/analyze', formData); // Ensure this matches server.js endpoint
};

// Example of another API call if needed in the future
// export const getSomeData = () => {
//     return apiClient.get('/some-other-endpoint');
// };
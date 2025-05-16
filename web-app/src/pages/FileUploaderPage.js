import React, { useState } from 'react';
import { Upload, Button, message, Typography, Spin, Alert, theme as antdTheme } from 'antd';
import { InboxOutlined, SendOutlined, FileZipOutlined, CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { analyzeJavaProject } from '../services/api'; // api.js에서 API 함수 임포트

const { Dragger } = Upload;
const { Title, Paragraph } = Typography;

const FileUploaderPage = ({ setAnalysisResult, setIsLoading, setError }) => {
    const [fileList, setFileList] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const navigate = useNavigate();

    // App.js의 ConfigProvider로부터 테마 토큰을 가져옵니다.
    const { token } = antdTheme.useToken();

    const draggerProps = {
        name: 'zipFile',
        multiple: false,
        accept: ".zip,application/zip,application/x-zip-compressed",
        fileList: fileList,
        onRemove: () => {
            setFileList([]);
            setLocalError(null);
            return true;
        },
        beforeUpload: (file) => {
            const isZip = file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.toLowerCase().endsWith('.zip');
            if (!isZip) {
                const errorMsg = `${file.name} is not a valid ZIP file.`;
                message.error(errorMsg, 5);
                setLocalError(errorMsg);
                return Upload.LIST_IGNORE;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                const errorMsg = `${file.name} is too large (max 10MB).`;
                message.error(errorMsg, 5);
                setLocalError(errorMsg);
                return Upload.LIST_IGNORE;
            }
            setFileList([file]);
            setLocalError(null);
            return false; // Manual upload
        },
    };

    const handleUpload = async () => {
        if (fileList.length === 0) {
            const errorMsg = 'Please select a ZIP file to upload.';
            message.warning(errorMsg, 5);
            setLocalError(errorMsg);
            return;
        }

        setIsUploading(true);
        setLocalError(null);
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const response = await analyzeJavaProject(fileList[0]);
            setAnalysisResult(response.data);
            message.success(<><CheckCircleTwoTone twoToneColor={token.colorSuccess} /> Analysis complete! Navigating to results...</>, 3);
            navigate('/results');
        } catch (err) {
            let errorMsg = 'An unknown error occurred during analysis.';
            if (err.response && err.response.data && err.response.data.error) {
                errorMsg = err.response.data.error;
                if(err.response.data.details) errorMsg += `: ${err.response.data.details}`;
            } else if (err.message) {
                errorMsg = err.message;
            }
            console.error('Upload/Analysis exception:', err);
            setLocalError(errorMsg);
            setError(errorMsg);
            message.error(<><CloseCircleTwoTone twoToneColor={token.colorError} /> {errorMsg}</>, 7);
        } finally {
            setIsUploading(false);
            setIsLoading(false);
        }
    };

    return (
        // 이 div는 App.js의 .content-inner-wrapper 내부에 렌더링됩니다.
        // .content-inner-wrapper가 이미 다크 테마 배경을 가지고 있으므로,
        // 이 div 자체는 별도의 배경색을 가질 필요가 없거나,
        // 카드처럼 보이게 하려면 token.colorBgContainer를 사용할 수 있습니다.
        // 여기서는 CSS 클래스 'file-uploader-page-content'를 추가하여 App.css에서 스타일을 제어합니다.
        <div className="file-uploader-page-content">
            <div
                className="file-uploader-container" // 이 클래스에 대한 스타일은 App.css에 정의 (카드 형태)
                // style={{ background: token.colorBgContainer }} // 명시적으로 카드 배경색 적용 가능
            >
                <Title level={2} style={{ textAlign: 'center', marginBottom: '10px', color: token.colorTextBase }}>
                    <FileZipOutlined style={{ marginRight: '10px', color: token.colorPrimary }} />
                    Java Code Insight
                </Title>
                <Paragraph style={{ textAlign: 'center', color: token.colorTextSecondary, marginBottom: '30px', fontSize: '16px' }}>
                    Upload your Java project (ZIP archive) for detailed structural analysis.
                </Paragraph>

                {isUploading && (
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <Spin size="large" tip="Analyzing your project... This may take a few moments." />
                    </div>
                )}

                {localError && !isUploading && (
                    <Alert
                        message="Upload Problem"
                        description={localError}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setLocalError(null)}
                        style={{ marginBottom: '20px' }} // AntD 다크 테마가 Alert 스타일도 변경해줌
                    />
                )}

                {/* Dragger는 ConfigProvider의 다크 테마를 상속받아야 합니다. */}
                {/* 만약 흰색으로 나온다면, 전역 CSS에서 .ant-upload-drag 등이 흰색 배경을 강제하는지 확인 필요 */}
                <Dragger
                    {...draggerProps}
                    disabled={isUploading}
                    className="custom-dragger" // Dragger 스타일링을 위한 클래스 추가
                    // style={{ padding: '30px 20px', background: token.colorBgElevated }} // 필요시 명시적 배경색
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: token.colorPrimary }} />
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
                    disabled={fileList.length === 0 || isUploading}
                    loading={isUploading}
                    style={{ marginTop: 24, width: '100%' }}
                    size="large"
                >
                    {isUploading ? 'Analyzing...' : 'Analyze Project'}
                </Button>
            </div>
        </div>
    );
};

export default FileUploaderPage;
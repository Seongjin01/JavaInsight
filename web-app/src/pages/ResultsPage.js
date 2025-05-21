import React, { useState, useMemo } from 'react';
// [수정] 사용하지 않는 ShareAltOutlined, InfoCircleOutlined 제거 또는 실제 사용
import { Spin, Alert, Row, Col, Typography, Collapse, Empty, Input, Segmented, Tag, List as AntdList, Divider, Button } from 'antd';
import { CodeOutlined, WarningOutlined, ApartmentOutlined, FileTextOutlined, IssuesCloseOutlined } from '@ant-design/icons'; // 사용되는 아이콘만 남김
import ClassCard from '../components/ClassCard';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;
const { Search } = Input;

const ResultsPage = ({ analysisResult, isLoading, error }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('Cards');
    const navigate = useNavigate();

    // [수정] Hook 호출을 조건문 앞으로 이동
    const { classes, graphEdges, processingErrors } = analysisResult || { classes: [], graphEdges: [], processingErrors: [] };

    const filteredClasses = useMemo(() => {
        if (!classes) return [];
        return classes.filter(cls =>
            (cls.className?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (cls.packageName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (cls.simpleName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [classes, searchTerm]); // classes가 null일 수 있으므로, analysisResult 전체를 의존성 배열에 넣거나, classes가 null일 때 빈 배열을 반환하도록 수정

    const overallClassWarnings = useMemo(() => {
        if (!classes) return [];
        let warnings = [];
        classes.forEach(cls => {
            if (cls.warnings && cls.warnings.length > 0) {
                warnings.push(...cls.warnings.map(w => ({
                    key: `${cls.className}-cw-${w}-${Math.random()}`, // 좀 더 고유한 키
                    type: 'Class',
                    source: cls.simpleName,
                    message: w,
                    color: 'orange'
                })));
            }
            if (cls.methods) { // methods가 없을 수도 있으므로 방어 코드 추가
                cls.methods.forEach(m => {
                    if (m.warnings && m.warnings.length > 0) {
                        warnings.push(...m.warnings.map(mw => ({
                            key: `${cls.className}-${m.methodName}-mw-${mw}-${Math.random()}`, // 좀 더 고유한 키
                            type: 'Method',
                            source: `${cls.simpleName}.${m.methodName}()`,
                            message: mw,
                            color: 'volcano'
                        })));
                    }
                });
            }
        });
        return warnings;
    }, [classes]); // classes가 null일 수 있으므로, analysisResult 전체를 의존성 배열에 넣거나, classes가 null일 때 빈 배열을 반환하도록 수정

    // 이제 조건부 렌더링
    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <Spin size="large" tip="Loading analysis results..." />
            </div>
        );
    }

    if (error && !analysisResult) {
        return (
            <Alert
                message="Analysis Error"
                description={<>There was an error processing your request. Details: <Text code>{typeof error === 'string' ? error : JSON.stringify(error)}</Text></>}
                type="error"
                showIcon
                style={{ margin: '20px' }}
            />
        );
    }
    
    // [수정] no-mixed-operators 방지를 위한 괄호 추가
    if (!analysisResult || (classes.length === 0 && (!processingErrors || processingErrors.length === 0) && !isLoading)) {
         return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <Empty
                    image={<FileTextOutlined style={{ fontSize: 60, color: '#ccc' }}/>}
                    description={
                        <>
                            <Title level={4}>No Analysis Results To Display</Title>
                            <Paragraph>Please upload a Java project first to see the analysis.</Paragraph>
                            <Button type="primary" onClick={() => navigate('/')}>Upload Project</Button>
                        </>
                    }
                />
            </div>
        );
    }
    // ... (getImportPackageSummary 및 나머지 렌더링 로직은 이전과 유사하게 유지, graphEdges는 사용되지 않는다면 제거 또는 주석 처리) ...
    // graphEdges는 현재 사용되지 않으므로, ESLint 경고를 피하기 위해 주석 처리하거나 실제 사용 로직을 추가해야 합니다.
    // const { classes, /* graphEdges, */ processingErrors } = ...

    // ... (나머지 컴포넌트 코드) ...
    return (
        <div className="results-page-container" style={{padding: '0 16px'}}> {/* 페이지 전체 패딩 조정 */}
            <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24, marginTop: 10 }}>
                <Col>
                    <Title level={3} style={{ margin: 0 }}>
                        <CodeOutlined style={{ marginRight: 10 }} /> Analysis Dashboard
                    </Title>
                    {classes && (
                        <Paragraph type="secondary" style={{marginTop: 4, marginBottom: 0}}>
                            Analyzed {classes.length} classes/interfaces.
                            {searchTerm && ` (${filteredClasses.length} matching filter)`}
                        </Paragraph>
                    )}
                </Col>
                {/* Segmented는 사용하지 않으므로 일단 제거
                <Col>
                    <Segmented
                        options={[ { label: 'Cards', value: 'Cards', icon: <ApartmentOutlined /> } ]}
                        value={viewMode}
                        onChange={setViewMode}
                    />
                </Col>
                */}
            </Row>

            <Search
                placeholder="Filter by class name or package..."
                allowClear
                size="large"
                onChange={e => setSearchTerm(e.target.value)} // setSearchTerm 사용
                style={{ marginBottom: 24 }}
            />

            {processingErrors && processingErrors.length > 0 && (
                 <Alert
                    message={<><IssuesCloseOutlined /> File Processing Issues</>}
                    description={
                        <AntdList // AntdList 사용 시 import 필요
                            size="small"
                            dataSource={processingErrors}
                            renderItem={item => <AntdList.Item style={{padding: '4px 0', color: 'var(--antd-colorErrorText)'}}>{item}</AntdList.Item>}
                        />
                    }
                    type="error"
                    showIcon
                    style={{ marginBottom: 24 }}
                 />
            )}

            <Divider>Analyzed Classes</Divider>

            {filteredClasses.length === 0 && searchTerm && classes && classes.length > 0 && (
                 <Empty description={<>No classes found matching "<strong>{searchTerm}</strong>".</>} style={{marginTop: 30}}/>
            )}
            {filteredClasses.length === 0 && !searchTerm && (!classes || classes.length === 0) && (!processingErrors || processingErrors.length === 0) && (
                 <Empty description="No class information was processed or found." style={{marginTop: 30}}/>
            )}

            {/* [수정] Row에 align="stretch" 추가, Col에 style={{ display: 'flex' }} 추가 */}
            <Row gutter={[24, 24]} align="stretch">
                {filteredClasses.map((classData) => (
                    // 각 Col이 flex 아이템이 되어 내부 Card가 높이를 채울 수 있도록 함
                    <Col xs={24} md={12} xl={8} key={classData.className} style={{ display: 'flex' }}>
                        {/* ClassCard에 height: '100%' 스타일이 적용되어야 함 (ClassCard.js 또는 CSS에서) */}
                        <ClassCard classData={classData} />
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default ResultsPage;
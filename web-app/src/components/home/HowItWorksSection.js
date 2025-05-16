import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import { UploadOutlined, ThunderboltOutlined, SolutionOutlined, BarChartOutlined } from '@ant-design/icons';
import './SectionStyles.css';

const { Title, Paragraph } = Typography;

const steps = [
    {
        icon: <UploadOutlined />,
        title: '1. ZIP 파일 업로드',
        description: '분석할 Java 프로젝트 소스 코드를 ZIP 파일 형태로 간편하게 업로드합니다. 별도의 설정이나 설치 과정이 필요 없습니다.',
    },
    {
        icon: <ThunderboltOutlined />,
        title: '2. 자동 코드 분석',
        description: '업로드된 코드는 즉시 AST(추상 구문 트리)로 변환되어 구조, 관계, 메트릭 등이 정밀하게 분석됩니다.',
    },
    {
        icon: <BarChartOutlined />, // 또는 SolutionOutlined
        title: '3. 결과 및 인사이트 확인',
        description: '클래스 카드, 호출 관계, 코드 품질 지표 등 시각화된 분석 결과를 통해 프로젝트를 깊이 있게 이해하고 개선점을 찾으세요.',
    },
];

const HowItWorksSection = () => {
    return (
        // [수정] dark-section 적용
        <div className="section-container dark-section">
            <Title level={2} className="section-title">간단하고 빠른 분석 과정</Title>
            <Paragraph className="section-subtitle">
                단 몇 번의 클릭만으로 Java 코드 분석을 시작하고, 프로젝트에 대한 명확한 이해를 얻을 수 있습니다.
            </Paragraph>
            <Row gutter={[32, 32]} justify="center" style={{ marginTop: '50px' }}>
                {steps.map((step, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                        {/* [수정] card-in-dark-section 및 text-center 적용 */}
                        <Card hoverable className="card-in-dark-section text-center" bordered={false}>
                            <div>{step.icon}</div> {/* 아이콘 스타일은 CSS에서 제어 */}
                            <Title level={4}>{step.title}</Title> {/* 텍스트 색상은 CSS에서 제어 */}
                            <Paragraph style={{ minHeight: '80px' }}>{step.description}</Paragraph>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default HowItWorksSection;
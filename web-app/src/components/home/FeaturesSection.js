import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import {
    PartitionOutlined, // 코드 구조
    DashboardOutlined, // 메트릭
    BellOutlined,      // 경고
    BookOutlined,      // 표준 라이브러리 비교 (교육적)
    ForkOutlined,      // 의존성
    RocketOutlined,    // 사용 편의성
} from '@ant-design/icons';
import './SectionStyles.css';

const { Title, Paragraph } = Typography;

const features = [
    {
        icon: <PartitionOutlined />,
        title: '직관적인 코드 구조 시각화',
        description: '클래스, 인터페이스, 상속 및 호출 관계를 명확하게 파악하여 코드 전체의 그림을 쉽게 이해할 수 있도록 돕습니다.',
    },
    {
        icon: <DashboardOutlined />,
        title: '핵심 코드 메트릭 제공',
        description: 'LOC, Cyclomatic Complexity 등 객관적인 지표를 통해 코드의 품질과 복잡도를 정량적으로 평가하고 관리합니다.',
    },
    {
        icon: <BellOutlined />,
        title: '잠재적 개선점 알림',
        description: '긴 메소드, 과도한 복잡도 등 유지보수를 저해하거나 버그를 유발할 수 있는 부분을 식별하여 선제적으로 대응하도록 합니다.',
    },
    {
        icon: <BookOutlined />,
        title: '표준 라이브러리 구조 비교',
        description: '작성한 코드가 JDK 표준 클래스 구조와 얼마나 유사한지 비교 분석하여 코드 이해도를 높이고 학습 효과를 증진시킵니다.',
    },
    {
        icon: <ForkOutlined />,
        title: '외부 라이브러리 의존성 확인',
        description: '프로젝트가 어떤 외부 라이브러리들을 사용하고 있는지 한눈에 파악하여 의존성 관리에 도움을 줍니다.',
    },
    {
        icon: <RocketOutlined />,
        title: '간편한 사용법 (ZIP 업로드)',
        description: '복잡한 설정 없이 소스 코드 ZIP 파일만 업로드하면 즉시 분석을 시작할 수 있어 누구나 쉽게 사용할 수 있습니다.',
    },
];

const FeaturesSection = () => {
    return (
        <div className="section-container dark-section"> {/* [수정] dark-section 적용 */}
            <Title level={2} className="section-title">JavaInsight의 특별한 기능들</Title>
            <Paragraph className="section-subtitle">
                단순한 분석 도구를 넘어, 코드에 대한 깊이 있는 이해와 프로젝트 개선을 위한 실질적인 가치를 제공합니다.
            </Paragraph>
            <Row gutter={[32, 32]} style={{ marginTop: '50px' }}>
                {features.map((feature, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                        <Card hoverable className="card-in-dark-section" bordered={false}> {/* [수정] card-in-dark-section 적용 */}
                            <div>{feature.icon}</div> {/* 아이콘 스타일은 CSS에서 .card-in-dark-section .anticon 으로 제어 */}
                            <Title level={4}>{feature.title}</Title>
                            <Paragraph>{feature.description}</Paragraph>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default FeaturesSection;
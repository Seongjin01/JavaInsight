import React from 'react';
import { Typography, Row, Col, Card, Tag } from 'antd';
import { UserSwitchOutlined, ReconciliationOutlined, BugOutlined, SolutionOutlined, RiseOutlined, TeamOutlined } from '@ant-design/icons';
import './SectionStyles.css';

const { Title, Paragraph } = Typography;

const useCases = [
    {
        icon: <UserSwitchOutlined />,
        title: '신규 팀원 온보딩',
        description: '새로운 프로젝트나 레거시 코드에 신규 팀원이 빠르게 적응하고 전체 구조를 이해하는 데 도움을 줍니다.',
        tags: ['교육', '팀 적응', '생산성 향상'],
    },
    {
        icon: <ReconciliationOutlined />,
        title: '코드 리뷰 효율화',
        description: '객관적인 코드 메트릭과 구조 정보를 바탕으로 효과적이고 일관된 코드 리뷰를 진행할 수 있습니다.',
        tags: ['품질 관리', '협업', '표준화'],
    },
    {
        icon: <BugOutlined />,
        title: '레거시 시스템 분석',
        description: '복잡하고 문서가 부족한 레거시 코드의 현재 상태를 파악하고, 리팩토링 및 현대화 계획 수립의 기초 자료로 활용합니다.',
        tags: ['유지보수', '기술 부채', '현대화'],
    },
    {
        icon: <SolutionOutlined />,
        title: '아키텍처 이해 및 검증',
        description: '프로젝트의 실제 코드 구조와 의도했던 아키텍처가 얼마나 부합하는지 확인하고 개선 방향을 모색할 수 있습니다.',
        tags: ['설계', '아키텍처', '품질 검증'],
    },
    {
        icon: <RiseOutlined />,
        title: '기술 부채 관리',
        description: '코드 복잡도, 중복, 잠재적 위험 등을 정량적으로 파악하여 기술 부채를 관리하고 점진적으로 개선합니다.',
        tags: ['코드 품질', '장기적 관리', '위험 감소'],
    },
    {
        icon: <TeamOutlined />,
        title: '기술 스터디 및 교육 자료',
        description: '실제 코드를 기반으로 한 분석 자료는 Java 문법, 디자인 패턴, 좋은 코드 작성법 등을 학습하는 데 효과적입니다.',
        tags: ['학습 자료', '코드 이해', '실습'],
    },
];

const UseCasesSection = () => {
    return (
        <div className="section-container dark-section">
            <Title level={2} className="section-title light-title">다양한 활용 사례</Title>
            <Paragraph className="section-subtitle light-subtitle">
                JavaInsight Analyzer는 개발 프로세스의 여러 단계에서 실질적인 도움을 줄 수 있습니다.
            </Paragraph>
            <Row gutter={[24, 24]} style={{ marginTop: '50px' }}>
                {useCases.map((useCase, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                        <Card hoverable className="feature-card dark-card" style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '28px', color: '#00b96b', marginBottom: '15px' }}>{useCase.icon}</div>
                            <Title level={4} style={{ marginBottom: '8px', color: 'white' }}>{useCase.title}</Title>
                            <Paragraph style={{ minHeight: '70px', color: 'white', marginBottom: '15px' }}>{useCase.description}</Paragraph>
                            <div>
                                {useCase.tags.map(tag => <Tag color="#00b96b" key={tag} style={{marginBottom: '5px'}}>{tag}</Tag>)}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default UseCasesSection;
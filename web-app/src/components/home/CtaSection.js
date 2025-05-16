import React from 'react';
import { Typography, Button, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { RocketOutlined } from '@ant-design/icons';
import './SectionStyles.css';

const { Title, Paragraph } = Typography;

const CtaSection = () => {
    return (
        <div className="section-container dark-section" style={{paddingBottom: '100px', paddingTop: '100px'}}>
            <Row justify="center">
                <Col xs={24} md={18} lg={14} style={{textAlign: 'center'}}>
                    <RocketOutlined style={{fontSize: '48px', color: '#00b96b', marginBottom: '20px'}}/>
                    <Title level={1} className="section-title" style={{marginBottom: '20px', fontSize: '2.8rem'}}>
                        지금 바로 Java 프로젝트 분석을 시작하세요!
                    </Title>
                    <Paragraph className="section-subtitle" style={{fontSize: '1.2rem', marginBottom: '40px'}}>
                        복잡한 코드 속에서 명확한 인사이트를 발견하고, 개발 생산성을 한 단계 높여보세요.
                        JavaInsight Analyzer가 여러분의 성공적인 프로젝트를 지원합니다.
                    </Paragraph>
                    <Link to="/analyzer">
                        <Button type="primary" size="large" style={{ padding: '0 40px', height: '55px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            무료로 분석 시작하기
                        </Button>
                    </Link>
                </Col>
            </Row>
        </div>
    );
};

export default CtaSection;
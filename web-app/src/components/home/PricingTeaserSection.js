import React from 'react';
import { Typography, Button, Row, Col, Card } from 'antd';
import { Link } from 'react-router-dom';
import { DollarCircleOutlined, GiftOutlined, ThunderboltOutlined } from '@ant-design/icons';
import './SectionStyles.css';

const { Title, Paragraph } = Typography;

const PricingTeaserSection = () => {
    return (
        <div className="section-container dark-section">
            <Title level={2} className="section-title light-title">합리적인 플랜으로 시작하세요</Title>
            <Paragraph className="section-subtitle light-subtitle">
                개인 개발자부터 대규모 팀까지, 모두를 위한 유연한 요금제를 제공합니다.
                지금 바로 무료 플랜으로 강력한 분석 기능을 경험해보세요!
            </Paragraph>
            <Row gutter={[24, 24]} justify="center" style={{ marginTop: '40px' }}>
                <Col xs={24} md={10} lg={7}>
                    <Card hoverable className="feature-card light-card" style={{textAlign: 'center'}}>
                        <GiftOutlined style={{fontSize: '40px', color: '#00b96b', marginBottom: '15px'}}/>
                        <Title level={3} style={{color: 'white'}}>Free Plan</Title>
                        <Paragraph style={{minHeight: '60px', color: '#999'}}>
                            핵심 분석 기능과 제한된 프로젝트 분석을 무료로 제공합니다.
                            개인 프로젝트나 학습용으로 적합합니다.
                        </Paragraph>
                        <Link to="/plans">
                            <Button type="default" size="large" style={{marginTop: '15px'}}>플랜 자세히 보기</Button>
                        </Link>
                    </Card>
                </Col>
                <Col xs={24} md={10} lg={7}>
                     <Card hoverable className="feature-card light-card" style={{textAlign: 'center', borderColor: '#00b96b'}}>
                        <ThunderboltOutlined style={{fontSize: '40px', color: '#00b96b', marginBottom: '15px'}}/>
                        <Title level={3} style={{color: '#00b96b'}}>Pro Plan (예정)</Title>
                        <Paragraph style={{minHeight: '60px', color: '#999'}}>
                            더 많은 프로젝트, 고급 분석 기능, 우선 지원 등 전문가와 팀을 위한 강력한 기능을 제공할 예정입니다.
                        </Paragraph>
                         <Link to="/plans">
                            <Button type="primary" size="large" style={{marginTop: '15px'}}>Pro 플랜 살펴보기</Button>
                        </Link>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default PricingTeaserSection;
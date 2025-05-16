import React from 'react';
import { Button, Typography, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { RightOutlined, CodeTwoTone } from '@ant-design/icons'; // 아이콘 변경
import './HeroSection.css';

const { Title, Paragraph } = Typography;

const HeroSection = ({ scrollToSection }) => {
    return (
        <div className="hero-section hero-dark-gradient"> {/* 새 배경 클래스 */}
            <Row justify="center" align="middle" style={{ height: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <Col xs={22} sm={20} md={18} lg={16} xl={14}>
                    <CodeTwoTone twoToneColor="#22c55e" style={{ fontSize: '48px', marginBottom: '20px' }} />
                    <Title level={1} className="hero-title">
                        {/* [수정] 헤드라인 문구 변경 */}
                        Java 코드, 명쾌하게 분석하고 빠르게 이해하세요.
                    </Title>
                    <Paragraph className="hero-subtitle">
                        {/* [수정] 부제목 문구 변경 */}
                        JavaInsight는 복잡한 프로젝트의 내부를 투명하게 보여주고,
                        개발 효율성과 코드 품질을 한 단계 끌어올립니다.
                    </Paragraph>
                    <div className="hero-buttons">
                        <Button
                            type="primary" // AntD 테마의 primary 색상 자동 적용
                            size="large"
                            className="hero-cta-button" // CSS에서 추가 스타일링
                            icon={<RightOutlined />}
                            component={Link}
                            to="/analyzer"
                        >
                            지금 분석 시작
                        </Button>
                        <Button
                            size="large"
                            className="hero-learn-more-button" // CSS에서 스타일링
                            href="#features"
                            onClick={(e) => scrollToSection(e, 'features')}
                        >
                            핵심 기능 보기
                        </Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default HeroSection;
import React, { useEffect, useRef } from 'react';
import { Button, Typography, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import { RightOutlined, CodeTwoTone } from '@ant-design/icons'; // 아이콘 변경
import './HeroSection.css';
import { gsap } from 'gsap';

const { Title, Paragraph } = Typography;

const HeroSection = ({ scrollToSection }) => {

    const heroContentRef = useRef(null);
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const buttonsRef = useRef(null);

    useEffect(() => {
        // GSAP 애니메이션 정의
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // 초기 상태 설정 (CSS에서도 가능하지만, GSAP에서 명시적으로 하는 것이 좋음)
        gsap.set([titleRef.current, subtitleRef.current, buttonsRef.current], { autoAlpha: 0, y: 30 });

        tl.to(titleRef.current, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.2 })
          .to(subtitleRef.current, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.5") // 이전 애니메이션과 겹치게 시작
          .to(buttonsRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.4");

        // 컴포넌트 언마운트 시 타임라인 정리 (선택 사항, 간단한 애니메이션은 불필요할 수 있음)
        return () => {
            tl.kill();
        };
    }, []);

    return (
        <div className="hero-section hero-dark-gradient">
            <Row justify="center" align="middle" style={{ height: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <Col xs={22} sm={20} md={18} lg={16} xl={14} ref={heroContentRef}> {/* 전체 컨텐츠에 ref */}
                    <div ref={titleRef} style={{ opacity: 0 }}> {/* 초기 투명도 설정 */}
                        <CodeTwoTone twoToneColor="var(--antd-colorPrimary)" /* CSS 변수 사용 */ style={{ fontSize: '48px', marginBottom: '20px' }} />
                        <Title level={1} className="hero-title">
                            Java 코드, 명쾌하게 분석하고 빠르게 이해하세요.
                        </Title>
                    </div>
                    <div ref={subtitleRef} style={{ opacity: 0 }}>
                        <Paragraph className="hero-subtitle">
                            JavaInsight는 복잡한 프로젝트의 내부를 투명하게 보여주고,
                            개발 효율성과 코드 품질을 한 단계 끌어올립니다.
                        </Paragraph>
                    </div>
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
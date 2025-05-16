import React from 'react';
import { Layout, Menu, Button, Typography, Row, Col } from 'antd'; // Row, Col 다시 임포트 (푸터에서 사용 가능성)
import { Link } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import FeaturesSection from '../components/home/FeaturesSection';
import UseCasesSection from '../components/home/UseCasesSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import PricingTeaserSection from '../components/home/PricingTeaserSection';
import CtaSection from '../components/home/CtaSection';
import './LandingPage.css';

// 아이콘 임포트 (푸터에서 사용 예시)
import { GithubOutlined, MailOutlined, ReadOutlined } from '@ant-design/icons';


const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography; // Text 임포트 추가 (푸터에서 사용 가능성)

const LandingPage = () => {
    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <Layout className="landing-page-layout">
            <Header className="landing-header">
                <div className="landing-header-content">
                    <div className="landing-header-left">
                        <Link to="/" className="landing-logo">
                            <Title level={3} style={{ /* 이전 스타일 유지 */ margin: 0, lineHeight: '68px' /* 헤더 높이와 일치 */ }}>
                                JavaInsight
                            </Title>
                        </Link>
                        <Menu theme="dark" mode="horizontal" selectable={false} className="landing-menu">
                            <Menu.Item key="1"><a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>How it Works</a></Menu.Item>
                            <Menu.Item key="2"><a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a></Menu.Item>
                            <Menu.Item key="3"><a href="#use-cases" onClick={(e) => scrollToSection(e, 'use-cases')}>Use Cases</a></Menu.Item>
                            <Menu.Item key="4"><Link to="/plans">Pricing</Link></Menu.Item>
                            {/* [수정] FAQ 메뉴 주석 해제 및 Link 컴포넌트 사용 */}
                            <Menu.Item key="5"><Link to="/faq">FAQ</Link></Menu.Item>
                        </Menu>
                    </div>
                    <div className="landing-header-right">
                        <Link to="/analyzer">
                            {/* [수정] 버튼 텍스트 및 스타일 일관성 유지 (이전 제안 참고) */}
                            <Button type="primary" ghost className="try-button">Try Analyzer</Button>
                        </Link>
                        <Link to="/login" style={{ marginLeft: '15px' }}>
                            <Button type="default" className="login-button">Login</Button>
                        </Link>
                    </div>
                </div>
            </Header>

            <Content>
                {/* 각 섹션들은 이전 답변에서 제공한 내용을 그대로 사용합니다. */}
                <div id="hero">
                    <HeroSection scrollToSection={scrollToSection} />
                </div>
                <div id="how-it-works" className="section-padding">
                    <HowItWorksSection />
                </div>
                <div id="features" className="section-padding">
                    <FeaturesSection />
                </div>
                <div id="use-cases" className="section-padding">
                    <UseCasesSection />
                </div>
                <div id="testimonials" className="section-padding">
                    <TestimonialsSection />
                </div>
                <div id="pricing-teaser" className="section-padding">
                    <PricingTeaserSection />
                </div>
                <div id="cta" className="section-padding"> {/* CTA 섹션은 보통 마지막에 위치 */}
                    <CtaSection />
                </div>
            </Content>

            <Footer className="landing-footer">
                 <Row gutter={[16, 16]} justify="center" align="middle">
                    <Col xs={24} md={12} style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <Text style={{ color: 'var(--antd-colorTextTertiary, #6b7280)' }}>
                            JavaInsight Analyzer ©{new Date().getFullYear()} All rights reserved.
                        </Text>
                    </Col>
                    <Col xs={24} md={12} style={{ textAlign: 'center' }}>
                        <a href="https://github.com/YOUR_USERNAME/YOUR_REPO" target="_blank" rel="noopener noreferrer" style={{ margin: '0 10px', color: 'var(--antd-colorTextSecondary, #9ca3af)' }}>
                            <GithubOutlined /> GitHub
                        </a>
                        <Link to="/terms" style={{ margin: '0 10px', color: 'var(--antd-colorTextSecondary, #9ca3af)' }}>
                            Terms of Service
                        </Link>
                        <Link to="/privacy" style={{ margin: '0 10px', color: 'var(--antd-colorTextSecondary, #9ca3af)' }}>
                            Privacy Policy
                        </Link>
                        <a href="mailto:contact@javainsight.com" style={{ margin: '0 10px', color: 'var(--antd-colorTextSecondary, #9ca3af)' }}>
                            <MailOutlined /> Contact
                        </a>
                    </Col>
                </Row>
                 
                <Row justify="center" style={{ marginTop: '20px', opacity: 0.6 }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/1024px-Unofficial_JavaScript_logo_2.svg.png" alt="JS" style={{height: 20, margin: '0 10px'}}/>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1869px-Python-logo-notext.svg.png" alt="Python" style={{height: 20, margin: '0 10px'}}/>
                </Row>
            </Footer>
        </Layout>
    );
};

export default LandingPage;
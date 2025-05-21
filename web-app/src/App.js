import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, ConfigProvider, theme as antdTheme, Typography, Button, App as AntdApp } from 'antd';
import {
    HomeOutlined,
    UploadOutlined,
    BarChartOutlined,
    DollarCircleOutlined,
    QuestionCircleOutlined,
    CodeSandboxOutlined,
    GithubOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';

import LandingPage from './pages/LandingPage';
import FileUploaderPage from './pages/FileUploaderPage';
import ResultsPage from './pages/ResultsPage';
import PlansPage from './pages/PlansPage';
import FaqPage from './pages/FaqPage';

import './App.css';
// 페이지별/컴포넌트별 CSS는 해당 JS 파일 내에서 임포트 권장
// 예: import './pages/LandingPage.css'; // LandingPage.js 내부에서

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const MainAppContent = () => {
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { token } = antdTheme.useToken(); // ConfigProvider 내부이므로 정상

    const menuItems = useMemo(() => [
        { key: '/analyzer', icon: <UploadOutlined />, label: <Link to="/analyzer">Analyze Project</Link> },
        { key: '/results', icon: <BarChartOutlined />, label: <Link to="/results">View Results</Link> },
        { key: '/plans', icon: <DollarCircleOutlined />, label: <Link to="/plans">Pricing Plans</Link> },
        { key: '/faq', icon: <QuestionCircleOutlined />, label: <Link to="/faq">FAQ</Link> },
    ], []);

    const currentSelectedKeys = useMemo(() => {
        let currentPathKey = location.pathname;
        const matchedItem = [...menuItems].reverse().find(item => currentPathKey.startsWith(item.key) && item.key !== '/'); // Landing Home 제외
        if (matchedItem) {
            return [matchedItem.key];
        }
        // 랜딩 페이지('/')의 경우 Sider 메뉴에 해당 항목이 없으므로, 아무것도 선택되지 않도록 하거나
        // 또는 '/analyzer'를 기본으로 선택할 수 있음. 여기서는 선택 안 함.
        return location.pathname === '/' ? [] : [currentPathKey];
    }, [location.pathname, menuItems]);

    const breadcrumbItems = useMemo(() => {
        const pathSnippets = location.pathname.split('/').filter(i => i);
        const items = [{ key: 'home-breadcrumb', title: <Link to="/">Home</Link> }];
        let accumulatedPath = '';
        pathSnippets.forEach((snippet, index) => {
            accumulatedPath += `/${snippet}`;
            const menuItem = menuItems.find(m => m.key === accumulatedPath);
            const displayName = menuItem ? (React.isValidElement(menuItem.label) ? menuItem.label.props.children : menuItem.label)
                                      : (snippet.charAt(0).toUpperCase() + snippet.slice(1));
            if (index === pathSnippets.length - 1) {
                items.push({ title: displayName, key: accumulatedPath });
            } else if (menuItem) {
                items.push({ title: <Link to={accumulatedPath}>{displayName}</Link>, key: accumulatedPath });
            } else {
                items.push({ title: displayName, key: accumulatedPath });
            }
        });
        return location.pathname === '/' ? [] : items; // 랜딩페이지는 Breadcrumb 숨김
    }, [location.pathname, menuItems]);

    const isLandingPage = location.pathname === '/';

    return (
        <Layout style={{ display: 'flex', flexDirection: isLandingPage ? 'column' : 'row', minHeight: '100vh', background: token.colorBgLayout }}>
            {!isLandingPage && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    trigger={null}
                    width={230}
                    style={{ background: token.siderBg, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${token.colorBorder}` }}
                >
                    <Link to="/" className="sider-logo-link">
                        <div className="logo-container" style={{ background: token.headerBg /* Sider 상단 로고 배경 */ }}>
                            <CodeSandboxOutlined style={{ fontSize: '28px', color: token.colorPrimary }} />
                            {!collapsed && (
                                <Title level={4} style={{ margin: '0 0 0 10px', color: token.colorTextHeading, whiteSpace: 'nowrap' }}>
                                    JavaInsight
                                </Title>
                            )}
                        </div>
                    </Link>
                    <Menu
                        theme="dark" // 'dark' algorithm과 Menu 컴포넌트 토큰을 따름
                        selectedKeys={currentSelectedKeys}
                        mode="inline"
                        items={menuItems}
                        style={{ background: 'transparent', borderRight: 0, flexGrow: 1, padding: '8px 0' }}
                    />
                </Sider>
            )}
            <Layout className="site-content-layout" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', background: token.colorBgLayout }}>
                {!isLandingPage && (
                    <Header
                        className="app-header"
                        style={{
                            background: token.headerBg,
                            borderBottom: `1px solid ${token.colorBorder}`,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined style={{color: token.colorPrimaryText}} /> : <MenuFoldOutlined style={{color: token.colorPrimaryText}} />}
                                onClick={() => setCollapsed(!collapsed)}
                                className="sider-toggle-button"
                                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                            />
                            <Breadcrumb style={{ marginLeft: '16px' }} items={breadcrumbItems} />
                        </div>
                        <a href="https://github.com/YOUR_USERNAME/YOUR_REPO" target="_blank" rel="noopener noreferrer" title="GitHub Repository">
                            <GithubOutlined style={{ fontSize: '22px', color: token.colorTextSecondary, verticalAlign: 'middle' }} />
                        </a>
                    </Header>
                )}
                <Content
                    className={isLandingPage ? "landing-page-content-wrapper" : "app-content-wrapper"}
                    style={{
                        flexGrow: 1,
                        overflowY: isLandingPage ? 'visible' : 'auto',
                        padding: isLandingPage ? 0 : '20px', // 내부 페이지 외부 여백
                        background: token.colorBgLayout,
                        display: 'flex', flexDirection: 'column',
                    }}
                >
                    <div
                        className={isLandingPage ? "" : "content-inner-wrapper"}
                        style={isLandingPage ?
                            { flexGrow: 1, display: 'flex', flexDirection: 'column' } :
                            {
                                background: token.colorBgContainer, // 내부 페이지 콘텐츠 영역 배경
                                color: token.colorText,
                                borderRadius: token.borderRadiusLG,
                                padding: '24px', // 내부 페이지 콘텐츠 패딩
                                flexGrow: 1,
                                display: 'flex', flexDirection: 'column',
                                boxShadow: token.boxShadowTertiary, // 은은한 그림자
                            }
                        }
                    >
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/analyzer" element={<FileUploaderPage setAnalysisResult={setAnalysisResult} setIsLoading={setIsLoading} setError={setError} />} />
                            <Route path="/results" element={<ResultsPage analysisResult={analysisResult} isLoading={isLoading} error={error} />} />
                            <Route path="/plans" element={<PlansPage />} />
                            <Route path="/faq" element={<FaqPage />} />
                        </Routes>
                    </div>
                </Content>
                {!isLandingPage && (
                    <Footer
                        className="app-footer"
                        style={{
                            background: token.colorBgLayout, color: token.colorTextDescription,
                            borderTop: `1px solid ${token.colorBorderBg}`, flexShrink: 0,
                        }}
                    >
                        Java Insight Analyzer ©{new Date().getFullYear()}
                    </Footer>
                )}
            </Layout>
        </Layout>
    );
};

const AppWrapper = () => {
    // 새로운 색상 팔레트 정의 (좀 더 밝은 느낌의 다크 테마)
    const colorPrimary = '#4ADE80'; // 밝고 선명한 초록색 (Tailwind Green 400)
    const colorPrimaryHover = '#34D399'; // (Tailwind Green 500)
    const colorPrimaryActive = '#10B981'; // (Tailwind Green 600)

    const colorBgLayout = '#1E293B';      // 레이아웃 기본 배경 (Tailwind Slate 800)
    const colorBgContainer = '#334155';   // 카드, Sider, Header 등 컨테이너 배경 (Tailwind Slate 700)
    const colorBgElevated = '#475569';  // 드롭다운, 툴팁, 호버 배경 등 (Tailwind Slate 600)

    const colorTextHeading = '#F1F5F9';      // 제목용 텍스트 (Tailwind Slate 100)
    const colorText = '#E2E8F0';          // 본문 기본 텍스트 (Tailwind Slate 200)
    const colorTextSecondary = '#94A3B8'; // 보조 텍스트 (Tailwind Slate 400)
    const colorTextDescription = '#64748B';// 설명, placeholder 등 (Tailwind Slate 500)

    const colorBorder = '#475569';        // 일반 경계선 (Tailwind Slate 600)
    const colorBorderBg = '#334155';      // 배경 위의 경계선 (Tailwind Slate 700)
    const colorSplit = colorBorder;

    const customTheme = {
        token: {
            colorPrimary: colorPrimary,
            colorPrimaryHover: colorPrimaryHover,
            colorPrimaryActive: colorPrimaryActive,
            colorLink: colorPrimary,
            colorLinkHover: colorPrimaryHover,
            colorSuccess: colorPrimary,
            colorWarning: '#F59E0B', // Amber 500
            colorError: '#EF4444',   // Red 500
            colorInfo: '#3B82F6',    // Blue 500

            colorBgBase: colorBgLayout, // AntD의 colorBgBase는 보통 가장 바닥 레이어
            colorTextBase: colorText,   // AntD의 colorTextBase는 일반 텍스트
            colorText: colorText,
            colorTextHeading: colorTextHeading,
            colorTextSecondary: colorTextSecondary,
            colorTextTertiary: colorTextDescription, // AntD의 colorTextTertiary는 더 연함
            colorTextQuaternary: '#475569', // 더더 연함

            colorBorder: colorBorder,
            colorBorderSecondary: colorBorderBg, // 카드 등의 테두리
            colorSplit: colorSplit,

            colorBgContainer: colorBgContainer, // 카드, 모달, 팝오버 등
            colorBgElevated: colorBgElevated,   // 드롭다운, 툴팁
            colorBgLayout: colorBgLayout,       // Layout 컴포넌트 배경

            borderRadius: 6,
            borderRadiusLG: 8,
            borderRadiusSM: 4,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
            fontSize: 14,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)', // 기본 그림자
            boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', // 카드 호버 등
            boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 1px 6px 0 rgba(0, 0, 0, 0.04), 0 2px 4px 0 rgba(0, 0, 0, 0.04)', // 약한 그림자
        },
        algorithm: antdTheme.darkAlgorithm,
        components: {
            Layout: {
                siderBg: colorBgContainer,
                headerBg: colorBgContainer,
                bodyBg: colorBgLayout,
                footerBg: colorBgLayout,
                triggerBg: colorBgElevated,
                triggerColor: colorTextSecondary,
            },
            Menu: {
                itemBg: 'transparent',
                itemColor: colorTextSecondary,
                itemHoverColor: colorPrimary,
                itemSelectedColor: colorPrimary,
                itemSelectedBg: `${colorPrimary}20`, // alpha 0.12
                itemHoverBg: `${colorPrimary}1A`,    // alpha 0.1
                popupBg: colorBgElevated, // 드롭다운 메뉴 배경
            },
            Button: { /* ... (이전과 유사하게, 새로운 색상 토큰 사용) ... */ },
            Card: {
                colorBgContainer: colorBgContainer,
                colorBorderSecondary: colorBorderBg, // 카드 테두리
                actionsBg: colorBgElevated, // 카드 액션 영역 배경
            },
            Breadcrumb: { /* ... (이전과 유사하게, 새로운 색상 토큰 사용) ... */ },
            Spin: { colorTextDescription: colorTextSecondary, },
            Upload: { colorFillAlter: colorBgLayout, colorBorder: colorBorder, },
            Input: { /* ... */ }, Table: { /* ... */ }, Collapse: { /* ... */ }, Tag: { /* ... */ }
        }
    };

    return (
        <Router>
            <ConfigProvider theme={customTheme}>
                <AntdApp> {/* message, notification 컨텍스트 제공 */}
                    <MainAppContent />
                </AntdApp>
            </ConfigProvider>
        </Router>
    );
};

export default AppWrapper;
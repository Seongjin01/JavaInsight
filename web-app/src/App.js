import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Breadcrumb, ConfigProvider, theme as antdTheme, Typography, Button } from 'antd';
import {
    HomeOutlined,
    UploadOutlined,
    BarChartOutlined,
    DollarCircleOutlined,
    QuestionCircleOutlined,
    CodeSandboxOutlined, // 로고 아이콘
    GithubOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';

// 페이지 컴포넌트 임포트
import LandingPage from './pages/LandingPage';
import FileUploaderPage from './pages/FileUploaderPage';
import ResultsPage from './pages/ResultsPage';
import PlansPage from './pages/PlansPage';
import FaqPage from './pages/FaqPage';

// CSS 파일 임포트
import './App.css';
import './pages/LandingPage.css';
import './components/home/HeroSection.css';
import './components/home/SectionStyles.css';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const App = () => {
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [collapsed, setCollapsed] = useState(false);

    const location = useLocation();

    const customTheme = {
        token: {
            colorPrimary: '#22c55e',
            colorLink: '#22c55e',
            colorLinkHover: '#16a34a',
            colorBgBase: '#111827',
            colorTextBase: '#e5e7eb',
            colorTextSecondary: '#9ca3af',
            colorTextTertiary: '#6b7280',
            colorBorder: '#374151',
            colorBgContainer: '#1f2937',
            colorBgElevated: '#2a3142',
            borderRadius: 6,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
        },
        algorithm: antdTheme.darkAlgorithm,
        components: {
            Menu: {
                itemBg: 'transparent',
                itemColor: '#9ca3af',
                itemHoverColor: '#22c55e',
                itemSelectedColor: '#22c55e',
                itemSelectedBg: 'rgba(34, 197, 94, 0.15)',
                itemHoverBg: 'rgba(34, 197, 94, 0.1)',
            },
            Breadcrumb: {
                itemColor: '#9ca3af',
                lastItemColor: '#e5e7eb',
                linkColor: '#9ca3af',
                linkHoverColor: '#22c55e',
                separatorColor: '#6b7280',
            }
        }
    };
    const { token } = customTheme;

    const menuItems = useMemo(() => [
        { key: '/', icon: <HomeOutlined />, label: <Link to="/">Landing Home</Link> },
        { key: '/analyzer', icon: <UploadOutlined />, label: <Link to="/analyzer">Analyze Project</Link> },
        { key: '/results', icon: <BarChartOutlined />, label: <Link to="/results">View Results</Link> },
        { key: '/plans', icon: <DollarCircleOutlined />, label: <Link to="/plans">Pricing Plans</Link> },
        { key: '/faq', icon: <QuestionCircleOutlined />, label: <Link to="/faq">FAQ</Link> },
    ], []);

    const currentSelectedKeys = useMemo(() => {
        let currentPathKey = location.pathname;
        const matchedItem = [...menuItems].reverse().find(item => currentPathKey.startsWith(item.key));
        return matchedItem ? [matchedItem.key] : [currentPathKey];
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
        return location.pathname === '/' ? [items[0]] : items;
    }, [location.pathname, menuItems]);

    const isLandingPage = location.pathname === '/';

    const AppLayout = (
        // [수정] 최상위 Layout: flexDirection을 isLandingPage에 따라 동적으로 변경하지 않고, 항상 row로 하되,
        // LandingPage 컴포넌트 자체가 Layout을 포함하도록 변경할 수 있습니다.
        // 여기서는 일단 이전 구조를 유지하되, Content의 overflow를 조절합니다.
        <Layout style={{ display: 'flex', flexDirection: isLandingPage ? 'column' : 'row', minHeight: '100vh', background: token.colorBgBase }}>
            {!isLandingPage && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    trigger={null}
                    width={230}
                    style={{ background: token.colorBgContainer, display: 'flex', flexDirection: 'column' }}
                >
                    <Link to="/" className="sider-logo-link">
                        <div className="logo-container" style={{ background: token.colorBgBase }}>
                            <CodeSandboxOutlined style={{ fontSize: '30px', color: token.colorPrimary, transition: 'all 0.3s' }} />
                            {!collapsed && (
                                <Title level={4} style={{ margin: '0 0 0 12px', color: token.colorTextBase, whiteSpace: 'nowrap' }}>
                                    JavaInsight
                                </Title>
                            )}
                        </div>
                    </Link>
                    <Menu
                        theme="dark"
                        selectedKeys={currentSelectedKeys}
                        mode="inline"
                        items={menuItems.filter(item => item.key !== '/')}
                        style={{ background: 'transparent', borderRight: 0, flexGrow: 1 }}
                    />
                </Sider>
            )}
            <Layout className="site-content-layout" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', background: token.colorBgBase }}>
                {!isLandingPage && (
                    <Header
                        className="app-header"
                        style={{
                            background: token.colorBgContainer,
                            borderBottom: `1px solid ${token.colorBorder}`,
                            padding: '0 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined style={{color: token.colorPrimary}} /> : <MenuFoldOutlined style={{color: token.colorPrimary}} />}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{ fontSize: '18px', width: 'auto', height: 'auto', padding: '10px' }}
                            />
                            <Breadcrumb style={{ marginLeft: '16px' }} items={breadcrumbItems} />
                        </div>
                        <a href="https://github.com/YOUR_USERNAME/YOUR_REPO" target="_blank" rel="noopener noreferrer" title="GitHub Repository">
                            <GithubOutlined style={{ fontSize: '24px', color: token.colorTextSecondary, verticalAlign: 'middle' }} />
                        </a>
                    </Header>
                )}
                <Content
                    className={isLandingPage ? "landing-page-content-wrapper" : "app-content-wrapper"}
                    style={{
                        flexGrow: 1,
                        // [수정] isLandingPage일 때는 overflowY를 설정하지 않거나 'visible'로 하여 브라우저 기본 스크롤 허용
                        // 내부 페이지일 때는 'auto'로 설정하여 내용이 넘칠 때만 Content 영역 내에서 스크롤
                        overflowY: isLandingPage ? 'visible' : 'auto',
                        padding: isLandingPage ? 0 : '16px', // 랜딩 페이지는 자체 패딩, 내부 페이지는 외부 여백
                        background: token.colorBgBase,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        className={isLandingPage ? "" : "content-inner-wrapper"}
                        style={isLandingPage ?
                            // 랜딩 페이지의 경우, 이 div는 공간만 차지하고 실제 스크롤은 LandingPage.js 내부의 Layout에서 담당
                            { flexGrow: 1, display: 'flex', flexDirection: 'column' } :
                            { // 내부 페이지의 실제 컨텐츠 영역
                                background: token.colorBgContainer,
                                color: token.colorTextBase,
                                borderRadius: token.borderRadius,
                                padding: 24,
                                flexGrow: 1, // 부모 Content 영역 내에서 가능한 공간을 채우도록
                                display: 'flex',
                                flexDirection: 'column',
                                // overflowY: 'auto', // 스크롤은 이제 부모인 Content에서 관리
                            }
                        }
                    >
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/analyzer" element={
                                <FileUploaderPage
                                    setAnalysisResult={setAnalysisResult}
                                    setIsLoading={setIsLoading}
                                    setError={setError}
                                />}
                            />
                            <Route path="/results" element={
                                <ResultsPage
                                    analysisResult={analysisResult}
                                    isLoading={isLoading}
                                    error={error}
                                />}
                            />
                            <Route path="/plans" element={<PlansPage />} />
                            <Route path="/faq" element={<FaqPage />} />
                        </Routes>
                    </div>
                </Content>
                {!isLandingPage && (
                    <Footer
                        className="app-footer"
                        style={{
                            background: token.colorBgBase,
                            color: token.colorTextTertiary,
                            borderTop: `1px solid ${token.colorBorder}`,
                            flexShrink: 0,
                            textAlign: 'center',
                            padding: '18px 50px'
                        }}
                    >
                        Java Insight Analyzer ©{new Date().getFullYear()}
                    </Footer>
                )}
            </Layout>
        </Layout>
    );

    return (
        <ConfigProvider theme={customTheme}>
            {AppLayout}
        </ConfigProvider>
    );
};

const AppWrapper = () => (
    <Router>
        <App />
    </Router>
);

export default AppWrapper;
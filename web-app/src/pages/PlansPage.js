import React from 'react';
import { Typography, Card, Row, Col, Button, List, Tag, theme as antdTheme } from 'antd';
import { Link } from 'react-router-dom';
import { GiftOutlined, ThunderboltOutlined, CrownOutlined, CheckCircleTwoTone } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const PlansPage = () => {
    const { token } = antdTheme.useToken(); // ConfigProvider로부터 테마 토큰 가져오기

    const plans = [
        {
            title: 'Free Tier',
            icon: <GiftOutlined style={{ fontSize: '36px', color: token.colorTextSecondary }} />,
            price: '$0',
            period: '/ month',
            features: [
                'Analyze up to 100 classes per project',
                'Basic metrics (LOC, CC, Methods, Fields)',
                'Standard JDK library mapping',
                'Community support',
            ],
            buttonText: 'Start for Free',
            buttonType: 'default',
            disabled: true,
        },
        {
            title: 'Developer Pro',
            icon: <ThunderboltOutlined style={{ fontSize: '36px', color: token.colorPrimary }} />,
            price: '$10',
            period: '/ month',
            features: [
                'Analyze up to 1,000 classes per project',
                'All Free Tier features',
                'Advanced warnings & suggestions',
                'External library usage summary',
                'Priority email support', // 이 항목 때문에 내용이 길어질 수 있음
            ],
            buttonText: 'Get Started',
            buttonType: 'primary',
            isPopular: true,
        },
        {
            title: 'Enterprise',
            icon: <CrownOutlined style={{ fontSize: '36px', color: token.colorWarning }} />,
            price: 'Contact Us',
            period: '',
            features: [
                'Unlimited classes & projects',
                'All Developer Pro features',
                'Customizable analysis rules (soon)',
                'On-premise deployment option (soon)',
                'Dedicated support & SLA',
            ],
            buttonText: 'Contact Sales',
            buttonType: 'default',
        },
    ];

    return (
        // 페이지 전체 div는 App.js의 content-inner-wrapper 스타일을 따르므로 별도 배경 지정 X
        <div style={{ padding: '10px 0' /* 상하 패딩만, 좌우는 content-inner-wrapper에서 */ }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '10px', color: token.colorTextBase }}>
                Choose Your Plan
            </Title>
            <Paragraph style={{ textAlign: 'center', marginBottom: '40px', fontSize: '16px', color: token.colorTextSecondary }}>
                Unlock powerful insights into your Java code. Simple, transparent pricing.
            </Paragraph>
            {/* [수정] Row에 align="stretch", Col에 display: 'flex' 적용 */}
            <Row gutter={[24, 24]} justify="center" align="stretch"> {/* align="stretch" 로 자식 Col들의 높이를 같게 */}
                {plans.map((plan, index) => (
                    <Col xs={24} sm={24} md={12} lg={8} key={index} style={{ display: 'flex' }}> {/* Col 자체를 flex container로 */}
                        <Card
                            title={
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                    {plan.icon}
                                    <Text style={{marginLeft: '10px', fontSize: '1.2em', fontWeight: 600, color: plan.isPopular ? token.colorPrimary : token.colorText }}>{plan.title}</Text>
                                </div>
                            }
                            bordered={true} // 테두리는 ConfigProvider의 colorBorder를 따름
                            hoverable
                            style={{ // Card 스타일
                                width: '100%', // 부모 Col 너비 채우기
                                display: 'flex', // Card 내부를 flex container로
                                flexDirection: 'column', // 내부 아이템(제목, 본문, 버튼)을 세로로 쌓기
                                ...(plan.isPopular ? { borderColor: token.colorPrimary, boxShadow: `0 4px 12px ${token.colorPrimary}4D` } : {}) // 인기 플랜 강조
                            }}
                            // Card의 body 영역이 남은 공간을 채우도록 설정
                            bodyStyle={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}
                            extra={plan.isPopular ? <Tag color="success" style={{background: token.colorPrimary, color: 'white', borderColor: token.colorPrimary}}>Most Popular</Tag> : null}
                        >
                            {/* 가격 및 features 리스트를 감싸는 div가 늘어나도록 */}
                            <div style={{ flexGrow: 1 }}>
                                <Title level={3} style={{ textAlign: 'center', color: plan.isPopular ? token.colorPrimary : token.colorText }}>
                                    {plan.price}
                                    <Text style={{ fontSize: '0.6em', color: token.colorTextTertiary }}>{plan.period}</Text>
                                </Title>
                                <List
                                    itemLayout="horizontal"
                                    dataSource={plan.features}
                                    renderItem={item => (
                                        <List.Item style={{borderBottom: `1px dashed ${token.colorBorder}`, padding: '10px 0'}}> {/* 패딩 조정 */}
                                            <CheckCircleTwoTone twoToneColor={token.colorPrimary} style={{ marginRight: '12px', fontSize: '16px', flexShrink: 0 }} />
                                            <Text style={{color: token.colorTextSecondary, flexGrow: 1, lineHeight: '1.5' }}>{item}</Text> {/* 라인 높이 조정 */}
                                        </List.Item>
                                    )}
                                    style={{ marginBottom: '30px' }}
                                />
                            </div>
                            {/* 버튼이 항상 하단에 위치하도록 */}
                            <Button
                                type={plan.buttonType}
                                block
                                size="large"
                                disabled={plan.disabled}
                                href={plan.title === 'Enterprise' ? 'mailto:sales@example.com' : undefined}
                                style={{ marginTop: 'auto' /* 상단 내용이 채워지고 남은 공간만큼 위로 밀어냄 */ }}
                            >
                                {plan.buttonText}
                            </Button>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default PlansPage;
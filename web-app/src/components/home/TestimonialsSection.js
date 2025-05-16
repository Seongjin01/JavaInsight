import React from 'react';
import { Typography, Row, Col, Card, Avatar } from 'antd';
import { UserOutlined, CommentOutlined } from '@ant-design/icons';
import './SectionStyles.css';

const { Title, Paragraph, Text } = Typography;

// 실제 후기는 추후 수집하여 추가합니다. 여기서는 예시 데이터입니다.
const testimonials = [
    {
        avatar: <UserOutlined />,
        name: '박성진 개발자',
        company: '스타트업 A 기술팀장',
        comment: '레거시 코드 분석에 정말 큰 도움이 되었습니다. 신입 팀원들도 빠르게 구조를 파악할 수 있었어요!',
    },
    {
        avatar: <UserOutlined />,
        name: '최지수 학생',
        company: 'Java 스터디 그룹',
        comment: '학교 프로젝트 리뷰할 때 사용했는데, 코드 복잡도를 객관적으로 볼 수 있어서 좋았습니다. UI도 직관적이에요.',
    },
    {
        avatar: <UserOutlined />,
        name: '김민준 강사',
        company: 'IT 교육기관',
        comment: 'Java 교육 자료로 활용도가 높습니다. 실제 코드를 보면서 설명하니 학생들이 더 잘 이해하는 것 같아요.',
    },
];

const TestimonialsSection = () => {
    return (
        <div className="section-container dark-section">
            <Title level={2} className="section-title">사용자들의 이야기</Title>
            <Paragraph className="section-subtitle">
                JavaInsight Analyzer를 통해 개발 효율성과 코드 품질을 향상시킨 분들의 경험을 확인해보세요.
            </Paragraph>
            <Row gutter={[32, 32]} style={{ marginTop: '50px' }} justify="center">
                {testimonials.map((testimonial, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                        <Card className="testimonial-card dark-card how-it-works-card" bordered={false}>
                             <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                                <Avatar size={48} icon={testimonial.avatar} style={{ marginRight: '15px', backgroundColor: '#00b96b' }} />
                                <div>
                                    <Text strong style={{ display: 'block', color: 'rgba(255,255,255,0.9)' }}>{testimonial.name}</Text>
                                    <Text type="secondary" style={{color: 'rgba(255,255,255,0.6)'}}>{testimonial.company}</Text>
                                </div>
                            </div>
                            <Paragraph style={{fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', minHeight: '80px'}}>
                                <CommentOutlined style={{marginRight: 8, color: '#00b96b'}}/> "{testimonial.comment}"
                            </Paragraph>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default TestimonialsSection;
// web-app/src/components/ClassCard.js
import React from 'react';
import { Card, Tag, Collapse, Table, Typography, List as AntdList, Divider, Statistic, Row, Col, Tooltip, Badge, theme as antdTheme } from 'antd';
import {
    CodeSandboxOutlined, // 클래스/인터페이스 아이콘
    WarningOutlined,     // 경고 아이콘
    FieldBinaryOutlined, // 필드 아이콘
    SettingOutlined,     // 메소드 아이콘
    BranchesOutlined,    // 상속/구현 아이콘
    InfoCircleTwoTone,   // 정보 아이콘 (classSummary)
    ExperimentOutlined,  // 아이콘 예시 (classSummary)
    ForkOutlined,        // 상속/구현 아이콘 (대체)
    ImportOutlined,      // 외부 라이브러리 아이콘
    FileTextOutlined,    // LOC 아이콘
    CalculatorOutlined,  // CC 아이콘 (대체)
    ProfileOutlined      // Javadoc 요약 아이콘
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Paragraph, Title } = Typography;

// Modifier 종류에 따라 다른 색상의 Tag를 반환하는 함수
const getModifierTagColor = (modifier) => {
    switch (modifier?.toLowerCase()) {
        case 'public': return 'success'; // AntD v5에서는 success, error, warning, processing 색상 사용 권장
        case 'private': return 'error';
        case 'protected': return 'warning';
        case 'static': return 'processing'; // 또는 blue, cyan 등
        case 'final': return 'purple';
        case 'abstract': return 'cyan';
        case 'synchronized': return 'magenta';
        default: return 'default'; // 또는 token.colorTextQuaternary
    }
};

const ClassCard = ({ classData }) => {
    const { token } = antdTheme.useToken(); // 테마 토큰 사용

    // classData가 없을 경우 빈 카드나 로딩 상태 등을 표시할 수 있음
    if (!classData) {
        return <Card bordered loading style={{ marginBottom: 20 }} />;
    }

    const {
        packageName = '(default package)',
        className, // FQCN
        simpleName = className?.substring(className.lastIndexOf('.') + 1) || 'Unknown Class',
        isInterface,
        modifiers = [],
        loc = 0,
        fieldCount = 0,
        methodCount = 0,
        classSummary = "No specific JDK structural similarity identified.",
        usesExternalLibraries = new Set(), // Set으로 가정, 없다면 빈 Set
        warnings = [], // Class-level warnings
        methods = [],
        fields = [],
        extendedTypes = [],
        implementedTypes = [],
        // imports = new Set() // 전체 import 목록은 너무 길 수 있어 일단 제외
    } = classData;

    // 메소드 테이블 컬럼 정의
    const methodColumns = [
        {
            title: 'Name', dataIndex: 'methodName', key: 'methodName', width: '30%',
            render: (name, record) => (
                <Tooltip placement="topLeft" title={
                    <>
                        {record.javadocSummary && <Paragraph style={{margin:0, fontSize:'0.85em', fontStyle:'italic', color: token.colorTextSecondary}}><ProfileOutlined /> {record.javadocSummary}</Paragraph>}
                        <Paragraph style={{margin:0, fontSize:'0.85em'}}><Text strong>Return:</Text> {record.returnType}</Paragraph>
                        {record.parameters && record.parameters.length > 0 &&
                            <Paragraph style={{margin:0, fontSize:'0.85em'}}><Text strong>Params:</Text> {record.parameters.join(', ')}</Paragraph>
                        }
                        {record.controlStatements && record.controlStatements.length > 0 &&
                            <Paragraph style={{margin:0, fontSize:'0.85em'}}><Text strong>Control Stmts:</Text> {record.controlStatements.slice(0,5).join(', ')}{record.controlStatements.length > 5 ? '...' : ''}</Paragraph>
                        }
                        {record.invokedMethods && record.invokedMethods.size > 0 && // Set으로 가정
                            <Paragraph style={{margin:0, fontSize:'0.85em'}}><Text strong>Calls:</Text> {Array.from(record.invokedMethods).slice(0,3).join(', ')}{record.invokedMethods.size > 3 ? '...' : ''}</Paragraph>
                        }
                    </>
                }>
                    <Text strong style={{color: token.colorText}}>{name}()</Text>
                </Tooltip>
            )
        },
        { title: 'LOC', dataIndex: 'loc', key: 'loc', width: '12%', sorter: (a, b) => a.loc - b.loc, align: 'center', render: val => <Text type="secondary">{val}</Text> },
        { title: 'CC', dataIndex: 'cyclomaticComplexity', key: 'cc', width: '12%', sorter: (a, b) => a.cyclomaticComplexity - b.cyclomaticComplexity, align: 'center', render: val => <Text type="secondary">{val}</Text> },
        {
            title: 'Modifiers', dataIndex: 'modifiers', key: 'modifiers', width: '30%',
            render: (mods) => mods?.map(m => <Tag color={getModifierTagColor(m)} key={m} style={{marginRight:3}}>{m}</Tag>)
        },
        {
            title: 'Warn', dataIndex: 'warnings', key: 'warnings', width: '16%', align: 'center',
            render: (warnsArray) => warnsArray && warnsArray.length > 0 && (
                <Tooltip title={warnsArray.join('; ')}>
                    <Tag color="error" icon={<WarningOutlined />}>{warnsArray.length}</Tag>
                </Tooltip>
            )
        }
    ];

    // 필드 테이블 컬럼 정의
    const fieldColumns = [
        { title: 'Name', dataIndex: 'fieldName', key: 'fieldName', render: text => <Text code style={{color: token.colorTextSecondary}}>{text}</Text> },
        { title: 'Type', dataIndex: 'fieldType', key: 'fieldType', render: text => <Text type="secondary">{text}</Text> },
        {
            title: 'Modifiers', dataIndex: 'modifiers', key: 'modifiers',
            render: (mods) => mods?.map(m => <Tag color={getModifierTagColor(m)} key={m} style={{marginRight:3}}>{m}</Tag>)
        },
    ];

    const cardTitle = (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tooltip title={className || 'Unknown Class FQCN'} placement="topLeft">
                <Title level={5} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 80px)', color: token.colorText }}>
                    <CodeSandboxOutlined style={{ marginRight: 8, color: isInterface ? token.colorInfo : token.colorPrimary }} />
                    {simpleName}
                </Title>
            </Tooltip>
            <Tag color={isInterface ? "blue" : "green"} style={{ marginLeft: 8, flexShrink: 0, fontWeight: 500 }}>
                {isInterface ? "Interface" : "Class"}
            </Tag>
        </div>
    );

    const totalClassAndMethodWarnings = (warnings?.length || 0) + methods.reduce((acc, m) => acc + (m.warnings?.length || 0), 0);

    return (
        <Badge.Ribbon
            text={totalClassAndMethodWarnings > 0 ? `${totalClassAndMethodWarnings} Issue${totalClassAndMethodWarnings > 1 ? 's' : ''}` : null}
            color={totalClassAndMethodWarnings > 0 ? token.colorError : token.colorSuccess}
            style={{ top: '-2px', right: '12px', display: totalClassAndMethodWarnings > 0 ? 'block' : 'none', fontSize: '0.8em' }}
        >
            <Card title={cardTitle} bordered={true} className="class-card" hoverable size="default"
                  style={{ background: token.colorBgContainer, borderColor: token.colorBorder }}>
                <Paragraph type="secondary" style={{fontSize: '0.85em', marginBottom: 12, borderBottom: `1px dashed ${token.colorBorder}`, paddingBottom: 8}}>
                    Package: {packageName}
                </Paragraph>

                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{marginRight: 8, color: token.colorTextSecondary}}>Modifiers:</Text>
                    {modifiers.map(m => <Tag color={getModifierTagColor(m)} key={m}>{m}</Tag>)}
                </div>

                <Row gutter={16} style={{ marginBottom: 16, textAlign: 'center' }}>
                    <Col span={8}><Statistic title={<Text type="secondary">LOC</Text>} value={loc} prefix={<FileTextOutlined style={{color: token.colorTextSecondary}}/>} valueStyle={{ fontSize: '1.3em', color: token.colorTextBase }}/></Col>
                    <Col span={8}><Statistic title={<Text type="secondary">Fields</Text>} value={fieldCount} prefix={<FieldBinaryOutlined style={{color: token.colorTextSecondary}}/>} valueStyle={{ fontSize: '1.3em', color: token.colorTextBase }}/></Col>
                    <Col span={8}><Statistic title={<Text type="secondary">Methods</Text>} value={methodCount} prefix={<SettingOutlined style={{color: token.colorTextSecondary}}/>} valueStyle={{ fontSize: '1.3em', color: token.colorTextBase }}/></Col>
                </Row>

                <Divider style={{ margin: '16px 0', borderColor: token.colorBorder }} />

                <Paragraph style={{marginBottom: 16}}>
                    <InfoCircleTwoTone twoToneColor={token.colorPrimary} style={{ marginRight: 8 }} />
                    <Text italic style={{color: token.colorTextSecondary}}>{classSummary}</Text>
                </Paragraph>

                {warnings && warnings.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong type="danger" style={{ fontSize: '0.9em' }}><WarningOutlined /> Class Level Warnings:</Text>
                        <AntdList
                            size="small"
                            dataSource={warnings}
                            renderItem={item => <AntdList.Item style={{padding: '4px 0', fontSize: '0.9em'}}><Tag color="error">{item}</Tag></AntdList.Item>}
                            style={{maxHeight: '100px', overflowY: 'auto', paddingLeft: '10px', border: `1px solid ${token.colorErrorBorder}`, borderRadius: token.borderRadiusSM}}
                        />
                    </div>
                )}

                <Collapse ghost accordion size="small" expandIconPosition="end" style={{borderColor: token.colorBorder}}
                          items={[
                            ...(extendedTypes.length > 0 ? [{
                                key: 'extends',
                                label: <Text strong style={{color: token.colorText}}><ForkOutlined /> Extends ({extendedTypes.length})</Text>,
                                children: <AntdList size="small" dataSource={extendedTypes} renderItem={item => <AntdList.Item><Text code style={{color: token.colorTextSecondary}}>{item}</Text></AntdList.Item>} />
                            }] : []),
                            ...(implementedTypes.length > 0 ? [{
                                key: 'implements',
                                label: <Text strong style={{color: token.colorText}}><ForkOutlined /> Implements ({implementedTypes.length})</Text>,
                                children: <AntdList size="small" dataSource={implementedTypes} renderItem={item => <AntdList.Item><Text code style={{color: token.colorTextSecondary}}>{item}</Text></AntdList.Item>} />
                            }] : []),
                            ...(fields && fields.length > 0 ? [{
                                 key: 'fields',
                                 label: <Text strong style={{color: token.colorText}}><FieldBinaryOutlined /> Fields ({fields.length})</Text>,
                                 children: <Table dataSource={fields} columns={fieldColumns} rowKey="fieldName" size="small" pagination={false} scroll={{ x: 'max-content' }} style={{background: 'transparent'}}/>
                            }] : []),
                            ...(methods && methods.length > 0 ? [{
                                key: 'methods',
                                label: <Text strong style={{color: token.colorText}}><SettingOutlined /> Methods ({methods.length})</Text>,
                                children: <Table dataSource={methods} columns={methodColumns} rowKey="methodName" size="small" pagination={{ pageSize: 5, size: 'small', hideOnSinglePage: true }} scroll={{ x: 'max-content' }} style={{background: 'transparent'}}/>
                            }] : []),
                             ...(usesExternalLibraries && usesExternalLibraries.size > 0 ? [{
                                key: 'externalLibs',
                                label: <Text strong style={{color: token.colorText}}><ImportOutlined /> External Libraries ({usesExternalLibraries.size})</Text>,
                                children: <AntdList size="small" dataSource={Array.from(usesExternalLibraries)} renderItem={lib => <AntdList.Item><Tag color="purple">{lib}</Tag></AntdList.Item>} />
                            }] : [])
                          ]}
                />
            </Card>
        </Badge.Ribbon>
    );
};

export default ClassCard;
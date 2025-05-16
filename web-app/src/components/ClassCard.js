import React from 'react';
import { Card, Tag, Collapse, Table, Typography, List as AntdList, Divider, Statistic, Row, Col, Tooltip, Badge } from 'antd';
import {
    CodeOutlined, WarningOutlined, FieldBinaryOutlined, SettingOutlined, BranchesOutlined,
    InfoCircleTwoTone, ExperimentOutlined, ForkOutlined, ImportOutlined, FileTextOutlined
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Paragraph, Title } = Typography;

const getModifierTagColor = (modifier) => {
    switch (modifier?.toLowerCase()) {
        case 'public': return 'success';
        case 'private': return 'error';
        case 'protected': return 'warning';
        case 'static': return 'processing';
        case 'final': return 'purple';
        case 'abstract': return 'cyan';
        default: return 'default';
    }
};

const ClassCard = ({ classData }) => {
    const {
        packageName,
        className, // FQCN
        simpleName,
        isInterface,
        modifiers = [],
        loc = 0,
        fieldCount = 0,
        methodCount = 0,
        classSummary = "No specific JDK structural similarity identified.",
        usesExternalLibraries = [],
        warnings = [], // Class-level warnings
        methods = [],
        fields = [],
        extendedTypes = [],
        implementedTypes = [],
        imports = [] // Full import list
    } = classData;

    const methodColumns = [
        {
            title: 'Name', dataIndex: 'methodName', key: 'methodName', width: '35%',
            render: (name, record) => (
                <Tooltip title={
                    <>
                        <Paragraph style={{margin:0, fontSize:'0.9em'}}><Text strong>Return:</Text> {record.returnType}</Paragraph>
                        {record.parameters && record.parameters.length > 0 &&
                            <Paragraph style={{margin:0, fontSize:'0.9em'}}><Text strong>Params:</Text> {record.parameters.join(', ')}</Paragraph>
                        }
                        {record.javadocSummary && <Paragraph style={{margin:0, fontSize:'0.9em', fontStyle:'italic', paddingTop: '4px'}}>{record.javadocSummary}</Paragraph>}
                    </>
                }>
                    <Text strong>{name}()</Text>
                </Tooltip>
            )
        },
        { title: 'LOC', dataIndex: 'loc', key: 'loc', width: '15%', sorter: (a, b) => a.loc - b.loc, align: 'center' },
        { title: 'CC', dataIndex: 'cyclomaticComplexity', key: 'cc', width: '15%', sorter: (a, b) => a.cyclomaticComplexity - b.cyclomaticComplexity, align: 'center' },
        {
            title: 'Modifiers', dataIndex: 'modifiers', key: 'modifiers', width: '20%',
            render: (mods) => mods?.map(m => <Tag color={getModifierTagColor(m)} key={m} style={{marginRight:3}}>{m}</Tag>)
        },
        {
            title: 'Warnings', dataIndex: 'warnings', key: 'warnings', width: '15%',
            render: (warns) => warns && warns.length > 0 && (
                <Tooltip title={warns.join(', ')}>
                    <Tag color="volcano" icon={<WarningOutlined />}>{warns.length}</Tag>
                </Tooltip>
            )
        }
    ];

    const fieldColumns = [
        { title: 'Name', dataIndex: 'fieldName', key: 'fieldName', render: text => <Text code>{text}</Text> },
        { title: 'Type', dataIndex: 'fieldType', key: 'fieldType' },
        {
            title: 'Modifiers', dataIndex: 'modifiers', key: 'modifiers',
            render: (mods) => mods?.map(m => <Tag color={getModifierTagColor(m)} key={m} style={{marginRight:3}}>{m}</Tag>)
        },
    ];

    const cardTitle = (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tooltip title={className}> {/* Show FQCN on hover */}
                <Title level={5} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 80px)' }}>
                    <ExperimentOutlined style={{ marginRight: 8, color: isInterface ? '#1890ff' : '#52c41a' }} />
                    {simpleName}
                </Title>
            </Tooltip>
            <Tag color={isInterface ? "geekblue" : "blue"} style={{ marginLeft: 8, flexShrink: 0 }}>
                {isInterface ? "Interface" : "Class"}
            </Tag>
        </div>
    );
    
    const totalMethodWarnings = methods.reduce((acc, m) => acc + (m.warnings?.length || 0), 0);
    const hasAnyWarnings = (warnings && warnings.length > 0) || totalMethodWarnings > 0;


    return (
        <Badge.Ribbon
            text={hasAnyWarnings ? `${(warnings?.length || 0) + totalMethodWarnings} Issues` : null}
            color={hasAnyWarnings ? "volcano" : "green"}
            style={{ top: '-2px', right: '10px', display: hasAnyWarnings ? 'block' : 'none' }}
        >
            <Card title={cardTitle} bordered={true} className="class-card" hoverable size="default">
                <Paragraph type="secondary" style={{ fontSize: '0.85em', marginBottom: 12, borderBottom: '1px dashed #eee', paddingBottom: 8}}>
                    Package: {packageName || '(default package)'}
                </Paragraph>

                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{marginRight: 8}}>Modifiers:</Text>
                    {modifiers.map(m => <Tag color={getModifierTagColor(m)} key={m}>{m}</Tag>)}
                </div>

                <Row gutter={16} style={{ marginBottom: 16, textAlign: 'center' }}>
                    <Col span={8}><Statistic title="LOC" value={loc} prefix={<FileTextOutlined />} valueStyle={{ fontSize: '1.3em', color: '#3f8600' }} /></Col>
                    <Col span={8}><Statistic title="Fields" value={fieldCount} prefix={<FieldBinaryOutlined />} valueStyle={{ fontSize: '1.3em', color: '#cf1322' }} /></Col>
                    <Col span={8}><Statistic title="Methods" value={methodCount} prefix={<SettingOutlined />} valueStyle={{ fontSize: '1.3em', color: '#108ee9' }} /></Col>
                </Row>

                <Divider style={{ margin: '16px 0' }} />

                <Paragraph style={{marginBottom: 16}}>
                    <InfoCircleTwoTone twoToneColor="#00b96b" style={{ marginRight: 8 }} />
                    <Text italic>{classSummary}</Text>
                </Paragraph>

                {warnings && warnings.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong type="danger" style={{ fontSize: '0.9em' }}><WarningOutlined /> Class Level Warnings:</Text>
                        <AntdList
                            size="small"
                            dataSource={warnings}
                            renderItem={item => <AntdList.Item style={{ padding: '4px 0', fontSize: '0.9em' }}><Tag color="error">{item}</Tag></AntdList.Item>}
                            style={{maxHeight: '100px', overflowY: 'auto', paddingLeft: '10px'}}
                        />
                    </div>
                )}

                <Collapse ghost accordion size="small" defaultActiveKey={['methods']}>
                    {extendedTypes.length > 0 && (
                        <Panel header={<><ForkOutlined /> Extends ({extendedTypes.length})</>} key="extends">
                            <AntdList size="small" dataSource={extendedTypes} renderItem={item => <AntdList.Item><Text code>{item}</Text></AntdList.Item>} />
                        </Panel>
                    )}
                    {implementedTypes.length > 0 && (
                        <Panel header={<><ForkOutlined /> Implements ({implementedTypes.length})</>} key="implements">
                            <AntdList size="small" dataSource={implementedTypes} renderItem={item => <AntdList.Item><Text code>{item}</Text></AntdList.Item>} />
                        </Panel>
                    )}
                    {fields && fields.length > 0 && (
                         <Panel header={<><FieldBinaryOutlined /> Fields ({fields.length})</>} key="fields">
                            <Table dataSource={fields} columns={fieldColumns} rowKey="fieldName" size="small" pagination={false} scroll={{ x: 'max-content' }} />
                        </Panel>
                    )}
                    {methods && methods.length > 0 && (
                        <Panel header={<><SettingOutlined /> Methods ({methods.length})</>} key="methods">
                            <Table dataSource={methods} columns={methodColumns} rowKey="methodName" size="small" pagination={{ pageSize: 5, size: 'small', hideOnSinglePage: true }} scroll={{ x: 'max-content' }} />
                        </Panel>
                    )}
                     {usesExternalLibraries && usesExternalLibraries.size > 0 && ( // Assuming Set
                        <Panel header={<><ImportOutlined /> External Libraries Used ({usesExternalLibraries.size})</>} key="externalLibs">
                            <AntdList
                                size="small"
                                dataSource={Array.from(usesExternalLibraries)} // Convert Set to Array for List
                                renderItem={lib => <AntdList.Item><Tag color="purple">{lib}</Tag></AntdList.Item>}
                            />
                        </Panel>
                    )}
                    {/* {imports && imports.size > 0 && ( // Full import list can be very long
                        <Panel header={`All Imports (${imports.size})`} key="imports_all">
                            <AntdList size="small" dataSource={Array.from(imports).slice(0,10)} renderItem={item => <AntdList.Item>{item}</AntdList.Item>} />
                            {imports.size > 10 && <Text type="secondary">...and {imports.size - 10} more.</Text>}
                        </Panel>
                    )} */}
                </Collapse>
            </Card>
        </Badge.Ribbon>
    );
};

export default ClassCard;
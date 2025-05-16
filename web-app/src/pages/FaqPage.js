import React from 'react';
import { Collapse, Typography } from 'antd';

const { Panel } = Collapse;
const { Title, Paragraph } = Typography;

const FaqPage = () => {
    const faqData = [
        {
            key: '1',
            question: 'What types of Java projects can be analyzed?',
            answer: 'Currently, the analyzer supports projects zipped with standard .java source files. Ensure your project structure is preserved within the ZIP.'
        },
        {
            key: '2',
            question: 'How is Lines of Code (LOC) calculated?',
            answer: 'LOC is calculated based on the start and end lines of a class or method definition in the source file. It includes comments and blank lines within that definition block.'
        },
        {
            key: '3',
            question: 'What does Cyclomatic Complexity (CC) indicate?',
            answer: 'Cyclomatic Complexity measures the number of linearly independent paths through a method\'s source code. A higher CC (e.g., >10) often indicates a more complex method that might be harder to test and maintain.'
        },
        // Add more FAQs
    ];

    return (
        <div>
            <Title level={2}>Frequently Asked Questions</Title>
            <Collapse accordion>
                {faqData.map(faq => (
                    <Panel header={faq.question} key={faq.key}>
                        <Paragraph>{faq.answer}</Paragraph>
                    </Panel>
                ))}
            </Collapse>
        </div>
    );
};

export default FaqPage;
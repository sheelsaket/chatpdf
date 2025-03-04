import { useRef, useState, useEffect } from "react";
import { Checkbox, ChoiceGroup, IChoiceGroupOption, Panel, DefaultButton, Spinner, TextField, SpinButton, Stack } from "@fluentui/react";

import styles from "./Edgar.module.css";
import { Dropdown, DropdownMenuItemType, IDropdownStyles, IDropdownOption } from '@fluentui/react/lib/Dropdown';

import { secSearch, AskResponse, AskRequest } from "../../api";
import { Answer, AnswerError } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { ExampleList, ExampleModel } from "../../components/Example";
import { DetailsList, DetailsListLayoutMode, Selection, SelectionMode, IColumn } from '@fluentui/react/lib/DetailsList';
import { Link } from '@fluentui/react/lib/Link';

type Item = {
    company:  { label: string; };
    filingLink:  { label: string; };
    contentSummary:  { label: string; };
    filingDate:  { label: string; };
    filingType:  { label: string; };
    reportPeriod:  { label: string; };
    content:  { label: string; };
  };

const OneShot = () => {
    const [selectedItem, setSelectedItem] = useState<IDropdownOption>();

    const lastQuestionRef = useRef<string>("");

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<unknown>();
    const [answer, setAnswer] = useState<AskResponse>();
    const [items, setItems] = useState<Item[]>([]);

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);

    //const [selectedIndex, setSelectedIndex] = useState<IDropdownOption>();
    const [selectedIndex, setSelectedIndex] = useState<string>();
    const [exampleList, setExampleList] = useState<ExampleModel[]>([{text:'', value: ''}]);
    const [exampleLoading, setExampleLoading] = useState(false)     

    const columns: IColumn[] = [
        {
          key: 'company',
          name: 'Company',
          fieldName: 'company',
          minWidth: 150,
          isMultiline: true,
        },
        {
            key: 'filingDate',
            name: 'Filing Date',
            fieldName: 'filingDate',
            minWidth: 80
        },
        {
            key: 'filingType',
            name: 'Filing Type',
            fieldName: 'filingType',
            minWidth: 80
        },
        {
          key: 'summary',
          name: 'Summary',
          isMultiline: true,
          minWidth: 900,
          isResizable: true,
          fieldName: 'contentSummary',
        },
        // {
        //     key: 'content',
        //     name: 'Content',
        //     isMultiline: true,
        //     minWidth: 900,
        //     isResizable: true,
        //     fieldName: 'content',
        // },
        {
            key: 'filingLink',
            name: 'Filings Link',
            fieldName: 'filingLink',
            minWidth: 100,
            isResizable: true,
            onRender: item => (
                // eslint-disable-next-line react/jsx-no-bind
                <Link href={item.filingLink}>
                  View
                </Link>
              ),
        }  
    ];
  
   
    const makeApiRequest = async (question: string) => {
        lastQuestionRef.current = question;

        error && setError(undefined);
        setIsLoading(true);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        try {
            const result = await secSearch('redis', 'secdocs', question, "10");
            
            const itemsResponse: Item[] = [];
            console.log(result.values[0].data.text);
            result.values[0].data.text.forEach((item: { company: any; completeFilingLink: any; contentSummary: any; filingDate: any; filingType: any; reportPeriod: any; content:any }) => {
                itemsResponse.push({
                    company: item.company,
                    filingLink: item.completeFilingLink,
                    contentSummary: item.contentSummary,
                    content: item.content,
                    filingDate: item.filingDate,
                    filingType: item.filingType,
                    reportPeriod: item.reportPeriod,
                });
            });
            setItems(itemsResponse);
            console.log(itemsResponse)
            //setAnswer(result);
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    const onToggleTab = (tab: AnalysisPanelTabs) => {
        if (activeAnalysisPanelTab === tab) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }
    };


    return (
        <div >
            <div >
                <div className={styles.oneshotTopSection}>
                    <h1 className={styles.oneshotTitle}>Ask your financial data</h1>
                    <div className={styles.oneshotQuestionInput}>
                        <QuestionInput
                            placeholder="Ask me anything"
                            disabled={isLoading}
                            onSend={question => makeApiRequest(question)}
                        />
                    </div>
                </div>
                <div className={styles.oneshotBottomSection}>
                    {isLoading && <Spinner label="Generating answer" />}
                    {!isLoading && !error && (
                        <div>
                            <div >
                                <DetailsList
                                    compact={true}
                                    items={items}
                                    columns={columns}
                                    setKey="multiple"
                                    selectionMode={SelectionMode.none}
                                    layoutMode={DetailsListLayoutMode.justified}
                                    isHeaderVisible={true}
                                    enterModalSelectionOnTouch={true}
                                />
                            </div>
                        </div>
                    )}
                    {error ? (
                        <div className={styles.oneshotAnswerContainer}>
                            <AnswerError error={error.toString()} onRetry={() => makeApiRequest(lastQuestionRef.current)} />
                        </div>
                    ) : null}
                    {activeAnalysisPanelTab && answer && (
                        <AnalysisPanel
                            className={styles.oneshotAnalysisPanel}
                            activeCitation={activeCitation}
                            onActiveTabChanged={x => onToggleTab(x)}
                            citationHeight="600px"
                            answer={answer}
                            activeTab={activeAnalysisPanelTab}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default OneShot;


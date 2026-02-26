import { Avatar, Button, Card, Text } from '@gravity-ui/uikit';
import { PageHeader } from '@/shared/components/PageHeader';
import EmilImage from '@/assets/emil.jpg';
import AndreyImage from '@/assets/andrey.jpg';
import corpImage from '@/assets/corp.jpg';
import './Support.css';

export default function SupportPage() {
    return (
        <div className="support-page">
            <PageHeader title="Support" />
                <Card view="outlined" className="support-page__card">
                    <div className="support-page__person">
                        <Avatar text="1202" imgUrl={corpImage} size="xl" theme="brand" className="support-page__avatar"
                                style={{
                                    width: "150px",
                                    height: "150px"
                                }} />
                        <Text variant="header-2">1202 corp.</Text>
                        <Text variant="body-2" color="secondary">
                            Student Development Club
                        </Text>
                        <Button
                            view="action"
                            className='support-button-to-write'
                            size="xl"
                            onClick={() => window.open('https://t.me/corp1202', '_blank', 'noopener,noreferrer')}
                        >
                            Check us!
                        </Button>
                    </div>
                </Card>
            <div className="support-page__grid" style={{ marginTop: "var(--g-spacing-6)" }}>
                <Card view="outlined" className="support-page__card">
                    <div className="support-page__person">
                        <Avatar text="EN" imgUrl={EmilImage} size="xl" theme="brand" className="support-page__avatar"
                                style={{
                                    width: "150px",
                                    height: "150px"
                                }} />
                        <Text variant="header-2" className='support_name_developer'>Emil Nabiullin</Text>
                        <Text variant="body-2" color="secondary">
                            Frontend
                        </Text>
                        <Button
                            view="action"
                            className='support-button-to-write'
                            size="xl"
                            onClick={() => window.open('https://t.me/PresidentOfTatarstan', '_blank', 'noopener,noreferrer')}
                        >
                            Text me!
                        </Button>
                    </div>
                </Card>

                <Card view="outlined" className="support-page__card">
                    <div className="support-page__person">
                        <Avatar text="AR" imgUrl={AndreyImage} size="xl" theme="brand" className="support-page__avatar"
                                style={{
                                    width: "150px",
                                    height: "150px"
                                }} />
                        <Text variant="header-2" className='support_name_developer'>Andrey Rastopshin</Text>
                        <Text variant="body-2" color="secondary">
                            Backend
                        </Text>
                        <Button
                            view="action"
                            className='support-button-to-write'
                            size="xl"
                            onClick={() => window.open('https://t.me/krojiak', '_blank', 'noopener,noreferrer')}
                        >
                            Text me!
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
